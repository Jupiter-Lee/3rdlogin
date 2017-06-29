const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const ArticleSchema = new Schema({
    title:{ type: String },
    content:{ type: String },
    author_id:{ type: ObjectId },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now },
})

const Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;