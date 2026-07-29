const { pool } = require('../config/database');

// Get all tags with pagination and search
exports.getAllTags = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'usage_count', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR slug LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Validate sort column
    const validSortColumns = ['name', 'slug', 'usage_count', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'usage_count';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) as total FROM tags ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Get total usage from all tags (not just current page)
    const totalUsageQuery = `SELECT SUM(usage_count) as total_usage FROM tags`;
    const [totalUsageResult] = await pool.query(totalUsageQuery);
    const totalUsage = totalUsageResult[0].total_usage || 0;

    const query = `
      SELECT id, name, slug, usage_count, created_at, updated_at
      FROM tags
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    const [tags] = await pool.query(query, [...params, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: tags,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalUsage
      }
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, message: 'Error fetching tags' });
  }
};

// Get a single tag by ID
exports.getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const [tag] = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);

    if (tag.length === 0) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    res.json({ success: true, data: tag[0] });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ success: false, message: 'Error fetching tag' });
  }
};

// Create a new tag
exports.createTag = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tag name is required' });
    }

    // Generate slug if not provided
    const tagSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const [result] = await pool.query(
      'INSERT INTO tags (name, slug, usage_count) VALUES (?, ?, 0)',
      [name.trim(), tagSlug]
    );

    const [newTag] = await pool.query('SELECT * FROM tags WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, data: newTag[0] });
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Tag with this name or slug already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating tag' });
  }
};

// Update a tag
exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const [existingTag] = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);
    if (existingTag.length === 0) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    const updateFields = [];
    const params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name.trim());
    }

    if (slug) {
      updateFields.push('slug = ?');
      params.push(slug);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);

    await pool.query(
      `UPDATE tags SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const [updatedTag] = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);

    res.json({ success: true, data: updatedTag[0] });
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Tag with this name or slug already exists' });
    }
    res.status(500).json({ success: false, message: 'Error updating tag' });
  }
};

// Delete a tag
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingTag] = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);
    if (existingTag.length === 0) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    await pool.query('DELETE FROM tags WHERE id = ?', [id]);

    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ success: false, message: 'Error deleting tag' });
  }
};

// Get tag suggestions for autocomplete
exports.getTagSuggestions = async (req, res) => {
  try {
    const { query: searchQuery, limit = 10 } = req.query;

    if (!searchQuery) {
      return res.json({ success: true, data: [] });
    }

    const [tags] = await pool.query(
      `SELECT name, slug, usage_count FROM tags 
       WHERE name LIKE ? 
       ORDER BY usage_count DESC, name ASC 
       LIMIT ?`,
      [`%${searchQuery}%`, parseInt(limit)]
    );

    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tag suggestions:', error);
    res.status(500).json({ success: false, message: 'Error fetching tag suggestions' });
  }
};

// Update tag usage count when content is created/updated
exports.updateTagUsage = async (tags) => {
  try {
    if (!tags || !Array.isArray(tags) || tags.length === 0) return;

    for (const tagName of tags) {
      const cleanTag = tagName.trim();
      if (cleanTag) {
        // Check if tag exists
        const [existing] = await pool.query('SELECT id FROM tags WHERE name = ?', [cleanTag]);
        
        if (existing.length > 0) {
          // Update usage count
          await pool.query('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [existing[0].id]);
        } else {
          // Create new tag
          const slug = cleanTag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          await pool.query('INSERT INTO tags (name, slug, usage_count) VALUES (?, ?, 1)', [cleanTag, slug]);
        }
      }
    }
  } catch (error) {
    console.error('Error updating tag usage:', error);
  }
};

// Decrease tag usage count when content is deleted
exports.decreaseTagUsage = async (tags) => {
  try {
    if (!tags || !Array.isArray(tags) || tags.length === 0) return;

    for (const tagName of tags) {
      const cleanTag = tagName.trim();
      if (cleanTag) {
        await pool.query('UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE name = ?', [cleanTag]);
      }
    }
  } catch (error) {
    console.error('Error decreasing tag usage:', error);
  }
};
