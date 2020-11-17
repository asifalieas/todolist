const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + "/date.js")
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.set('useFindAndModify', false);

const day = date.getDay();

const itemSchema = new mongoose.Schema({
    name: String
});
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const Item = mongoose.model('Item', itemSchema);
const List = mongoose.model('List', listSchema);

const item1 = new Item({
    name: 'welcome to To Do List'
});

const item2 = new Item({
    name: 'Hit the + button to add an item'
});

const item3 = new Item({
    name: '<-- Hit this to delete an item'
});

const defaultItems = [item1, item2, item3];


app.get('/', function (req, res) {
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Defualt Items successfully inserted');
                }
            });
            res.redirect('/');
        } else {
            res.render('list', { listTitle: day, newItems: foundItems });
        }
    });
});

app.get('/:customListName', function (req, res) {
    const customListName = req.params.customListName;

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customListName);
            } else {
                res.render('list', { listTitle: customListName, newItems: foundList.items });
            }
        }
    });
});

app.post('/', function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.addButton;

    const item = new Item({
        name: itemName
    });

    if (listName === day) {
        item.save();
        res.redirect('/');
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    }
});

app.post('/delete', function (req, res) {
    const checkedItemId = req.body.checkedItem;
    const listName = req.body.hiddenInput;

    if (listName === day) {
        Item.findByIdAndDelete(checkedItemId, function (err) {
            if (!err) {
                console.log('cheked item deleted successfully');
                res.redirect('/');
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect('/' + listName);
            }
        });
    }
});

app.listen(3000, function () {
    console.log("server started on port 3000");
});