use crate::commands::*;
use crate::migrate::migrate_db;
use crate::query_manager::QueryManager;
use crate::util::ModelChangeEvent;
use log::error;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use std::fs::create_dir_all;
use std::sync::mpsc;
use std::time::Duration;
use tauri::async_runtime::Mutex;
use tauri::plugin::TauriPlugin;
use tauri::{Emitter, Manager, Runtime, generate_handler};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

mod commands;

mod connection_or_tx;
pub mod db_context;
pub mod error;
mod migrate;
pub mod models;
pub mod queries;
pub mod query_manager;
pub mod render;
pub mod util;

pub struct SqliteConnection(pub Mutex<Pool<SqliteConnectionManager>>);

impl SqliteConnection {
    pub(crate) fn new(pool: Pool<SqliteConnectionManager>) -> Self {
        Self(Mutex::new(pool))
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    tauri::plugin::Builder::new("yaak-models")
        .invoke_handler(generate_handler![
            delete,
            duplicate,
            get_graphql_introspection,
            get_settings,
            grpc_events,
            upsert,
            upsert_graphql_introspection,
            websocket_events,
            workspace_models,
        ])
        .setup(|app_handle, _api| {
            let app_path = app_handle.path().app_data_dir().unwrap();
            create_dir_all(app_path.clone()).expect("Problem creating App directory!");

            let db_file_path = app_path.join("db.sqlite");

            let manager = SqliteConnectionManager::file(db_file_path);
            let pool = Pool::builder()
                .max_size(100) // Up from 10 (just in case)
                .connection_timeout(Duration::from_secs(10)) // Down from 30
                .build(manager)
                .unwrap();

            if let Err(e) = migrate_db(&pool) {
                error!("Failed to run database migration {e:?}");
                app_handle
                    .dialog()
                    .message(e.to_string())
                    .kind(MessageDialogKind::Error)
                    .blocking_show();
                return Err(Box::from(e.to_string()));
            };

            app_handle.manage(SqliteConnection::new(pool.clone()));

            {
                let (tx, rx) = mpsc::channel();
                app_handle.manage(QueryManager::new(pool, tx));
                let app_handle = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    for p in rx {
                        let name = match p.change {
                            ModelChangeEvent::Upsert => "upserted_model",
                            ModelChangeEvent::Delete => "deleted_model",
                        };
                        app_handle.emit(name, p).unwrap();
                    }
                });
            }

            Ok(())
        })
        .build()
}

#[cfg(test)]
mod migration_tests {
    use crate::migrate::migrate_db;
    use r2d2::Pool;
    use r2d2_sqlite::SqliteConnectionManager;
    use rusqlite::OptionalExtension;
    
    #[test]
    fn test_workflow_canvas_migration() {
        // Create an in-memory database for testing
        let manager = SqliteConnectionManager::memory();
        let pool = Pool::builder()
            .max_size(1)
            .build(manager)
            .expect("Failed to create connection pool");
        
        // Run migrations
        migrate_db(&pool).expect("Migration failed");
        
        let conn = pool.get().expect("Failed to get connection");
        
        // Verify workflow_nodes table exists
        let nodes_exists: Option<String> = conn
            .query_row(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='workflow_nodes'",
                [],
                |row| row.get(0),
            )
            .optional()
            .expect("Query failed");
        assert_eq!(nodes_exists, Some("workflow_nodes".to_string()));
        
        // Verify workflow_edges table exists
        let edges_exists: Option<String> = conn
            .query_row(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='workflow_edges'",
                [],
                |row| row.get(0),
            )
            .optional()
            .expect("Query failed");
        assert_eq!(edges_exists, Some("workflow_edges".to_string()));
        
        // Verify workflow_viewport table exists
        let viewport_exists: Option<String> = conn
            .query_row(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='workflow_viewport'",
                [],
                |row| row.get(0),
            )
            .optional()
            .expect("Query failed");
        assert_eq!(viewport_exists, Some("workflow_viewport".to_string()));
        
        // Verify workflow_node_executions table exists
        let node_exec_exists: Option<String> = conn
            .query_row(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='workflow_node_executions'",
                [],
                |row| row.get(0),
            )
            .optional()
            .expect("Query failed");
        assert_eq!(node_exec_exists, Some("workflow_node_executions".to_string()));
        
        // Verify canvas_enabled column in workflows table
        let canvas_col: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('workflows') WHERE name='canvas_enabled'",
                [],
                |row| row.get(0),
            )
            .expect("Query failed");
        assert_eq!(canvas_col, 1, "canvas_enabled column should exist");
        
        // Verify unique constraint on workflow_edges target_anchor
        let unique_idx: Option<String> = conn
            .query_row(
                "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_workflow_edges_target_unique'",
                [],
                |row| row.get(0),
            )
            .optional()
            .expect("Query failed");
        assert_eq!(unique_idx, Some("idx_workflow_edges_target_unique".to_string()));
        
        println!("✅ All workflow canvas migration checks passed!");
    }
    
    #[test]
    fn test_workflow_canvas_migration_idempotent() {
        // Create an in-memory database
        let manager = SqliteConnectionManager::memory();
        let pool = Pool::builder()
            .max_size(1)
            .build(manager)
            .expect("Failed to create connection pool");
        
        // Run migrations twice - should not fail
        migrate_db(&pool).expect("First migration failed");
        migrate_db(&pool).expect("Second migration failed (idempotency issue)");
        
        // Verify migration was only applied once
        let conn = pool.get().expect("Failed to get connection");
        let migration_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM _sqlx_migrations WHERE version LIKE '20251115000000%'",
                [],
                |row| row.get(0),
            )
            .expect("Query failed");
        assert_eq!(migration_count, 1, "Migration should only be recorded once");
        
        println!("✅ Migration idempotency check passed!");
    }

    #[test]
    fn test_workflow_canvas_migration_with_existing_data() {
        // Create an in-memory database and run migrations
        let manager = SqliteConnectionManager::memory();
        let pool = Pool::builder()
            .max_size(1)
            .build(manager)
            .expect("Failed to create connection pool");

        migrate_db(&pool).expect("Migration failed");

        let conn = pool.get().expect("Failed to get connection");

        // Insert a test workspace
        conn.execute(
            "INSERT INTO workspaces (id, model, created_at, updated_at, name, description) VALUES (?, ?, ?, ?, ?, ?)",
            ["ws1", "workspace", "1000000000", "1000000000", "Test Workspace", "Test workspace description"],
        ).expect("Failed to insert workspace");

        // Insert a test workflow (should have canvas_enabled column with default 0)
        conn.execute(
            "INSERT INTO workflows (id, model, created_at, updated_at, workspace_id, name, sort_priority)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            ["wf1", "workflow", "1000000000", "1000000000", "ws1", "Test Workflow", "0"],
        ).expect("Failed to insert workflow");

        // Verify canvas_enabled defaults to 0
        let canvas_enabled: i32 = conn
            .query_row(
                "SELECT canvas_enabled FROM workflows WHERE id = ?",
                ["wf1"],
                |row| row.get(0),
            )
            .expect("Query failed");
        assert_eq!(canvas_enabled, 0, "canvas_enabled should default to 0");

        // Insert a workflow node
        conn.execute(
            "INSERT INTO workflow_nodes
             (id, model, created_at, updated_at, workflow_id, node_type, node_subtype, name, config, position_x, position_y, width, height)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ["node1", "workflow_node", "1000000000", "1000000000", "wf1", "trigger", "manual_trigger",
             "Start", "{}", "100.0", "100.0", "250.0", "150.0"],
        ).expect("Failed to insert workflow node");

        // Insert another node
        conn.execute(
            "INSERT INTO workflow_nodes
             (id, model, created_at, updated_at, workflow_id, node_type, node_subtype, name, config, position_x, position_y, width, height)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ["node2", "workflow_node", "1000000000", "1000000000", "wf1", "action", "http_request",
             "HTTP Request", "{}", "400.0", "100.0", "250.0", "150.0"],
        ).expect("Failed to insert workflow node");

        // Insert an edge connecting the nodes
        conn.execute(
            "INSERT INTO workflow_edges
             (id, model, created_at, updated_at, workflow_id, source_node_id, target_node_id, source_anchor, target_anchor, edge_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ["edge1", "workflow_edge", "1000000000", "1000000000", "wf1", "node1", "node2", "output", "input", "sequential"],
        ).expect("Failed to insert workflow edge");

        // Insert viewport data
        conn.execute(
            "INSERT INTO workflow_viewport
             (id, model, created_at, updated_at, workflow_id, pan_x, pan_y, zoom)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ["vp1", "workflow_viewport", "1000000000", "1000000000", "wf1", "0.0", "0.0", "1.0"],
        ).expect("Failed to insert workflow viewport");

        // Verify data can be queried
        let node_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM workflow_nodes WHERE workflow_id = ?",
                ["wf1"],
                |row| row.get(0),
            )
            .expect("Query failed");
        assert_eq!(node_count, 2, "Should have 2 nodes");

        let edge_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM workflow_edges WHERE workflow_id = ?",
                ["wf1"],
                |row| row.get(0),
            )
            .expect("Query failed");
        assert_eq!(edge_count, 1, "Should have 1 edge");

        // Test unique constraint on target_anchor
        let duplicate_edge_result = conn.execute(
            "INSERT INTO workflow_edges
             (id, model, created_at, updated_at, workflow_id, source_node_id, target_node_id, source_anchor, target_anchor, edge_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ["edge2", "workflow_edge", "1000000000", "1000000000", "wf1", "node1", "node2", "output", "input", "sequential"],
        );
        assert!(duplicate_edge_result.is_err(), "Duplicate target_anchor should fail");

        // Verify foreign key constraints work
        let invalid_edge_result = conn.execute(
            "INSERT INTO workflow_edges
             (id, model, created_at, updated_at, workflow_id, source_node_id, target_node_id, source_anchor, target_anchor, edge_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ["edge3", "workflow_edge", "1000000000", "1000000000", "wf1", "nonexistent", "node2", "output", "other_input", "sequential"],
        );
        assert!(invalid_edge_result.is_err(), "Edge with nonexistent node should fail");

        println!("✅ Migration works correctly with existing data!");
    }
}
