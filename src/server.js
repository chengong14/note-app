const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      parent_id INTEGER,
      is_folder BOOLEAN
    )`);
  }
});

// 修改 GET 请求处理程序
app.get('/api/notes', (req, res) => {
    db.all('SELECT id, title, content, parent_id, is_folder FROM notes', [], (err, rows) => {
      if (err) {
        console.error('Error fetching notes:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      // Convert is_folder back to boolean
      rows = rows.map(row => ({...row, is_folder: row.is_folder === 1}));
      console.log('Sending notes:', rows);
      res.json(rows);
    });
  });
  
  // 修改 POST 请求处理程序
app.post('/api/notes', (req, res) => {
    const { title, content, parent_id, is_folder } = req.body;
    db.run('INSERT INTO notes (title, content, parent_id, is_folder) VALUES (?, ?, ?, ?)',
      [title, content, parent_id, is_folder ? 1 : 0], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID });
      });
  });
  
  // 添加一个新的路由来获取文件夹的内容
app.get('/api/notes/:id/children', (req, res) => {
    db.all('SELECT * FROM notes WHERE parent_id = ?', [req.params.id], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
});
// Update a note
app.put('/api/notes/:id', (req, res) => {
  const { title, content } = req.body;
  db.run('UPDATE notes SET title = ?, content = ? WHERE id = ?',
    [title, content, req.params.id], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Note updated successfully' });
    });
});

// Delete a note or folder
app.delete('/api/notes/:id', (req, res) => {
  db.run('DELETE FROM notes WHERE id = ?', req.params.id, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Note deleted successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});