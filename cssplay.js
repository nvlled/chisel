// TODO: provide navigation for all levels (an index)
// TODO: have sympathy for the color blinds

function copyChildren(dest, src) {
    var frag = document.createDocumentFragment();
    src = src.cloneNode(true);
    while (src.firstChild) {
        frag.appendChild(src.firstChild);
    }
    dest.appendChild(frag);
}

function selector(node, s, prop) {
    var subNode = node.querySelector(s);
    if (subNode && prop)
        return subNode[prop];
    return subNode;
}

// ----------------------------------------------------------

function getLevelData(node) {
    return {
        title: selector(node, ".title", "textContent"),
        info: selector(node, ".info", "innerHTML"),
        goal: selector(node, ".goal", "textContent"),
        node: selector(node, ".contents"),
    }
}

function identifyNodes(node) {
    var nodes = node.querySelectorAll("*");
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].setAttribute("data-id", i);
    }
}

function setLevel(mainNode, index, levelNode) {
    var levelData = getLevelData(levelNode);
    identifyNodes(levelData.node);

    mainNode.querySelector(".title").textContent = index+1 + ": " + levelData.title;
    mainNode.querySelector(".info").innerHTML = levelData.info;
    mainNode.querySelector(".goal").textContent = levelData.goal;
    var contentsNode = mainNode.querySelector(".contents");
    contentsNode.innerHTML = "";
    copyChildren(contentsNode, levelData.node);
}

// ----------------------------------------------------------

var store = {
    namespace: "localStorage.cssplay.",
    set: function(key, val) {
        localStorage[this.namespace+key] = val;
    },
    get: function(key) {
        return localStorage[this.namespace+key];
    },
    setJSON: function(key, obj) {
        this.set(key, JSON.stringify(obj));
    },
    getJSON: function(key) {
        try {
            return JSON.parse(this.get(key));
        } catch(e) {
            return null;
        }
    }
}

// ----------------------------------------------------------

var state = {
    level: 0,
    //savedSelectors: store.getJSON("savedSelectors"),
    completedLevels: [true, false, true],
}

var main = document.querySelector("#main");
var input = document.querySelector("input");
var errmsg = document.querySelector(".errmsg");
var completed = document.querySelector(".completed");
var levels = document.querySelector("#levels");

levels.remove();

var CORRECT_CLASS = "_X_";
var CHEATMSG = "NOCHEAT";

function clearSelected() {
    var nodes = document.querySelectorAll(".selected");
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.remove("selected");
    }
    completed.style.display = "none";
    input.classList.remove("ok");
    var levelLink = document.querySelector("#level-link-"+state.level);
    if (levelLink)
        levelLink.classList.remove("ok");
}

function getTargetNodes() {
    return main.querySelectorAll(".contents ." + CORRECT_CLASS);
}

function getSelected(sel) {
    var result = [];
    if (!sel)
        return result;
    sel.split(",").forEach(function(val) {
        // , aren't actually combinators?
        var sel = "#main .contents " + val.trim();
        sel = sel.replace(new RegExp(CORRECT_CLASS), CHEATMSG);
        var nodes = document.querySelectorAll(sel);
        result.concat(nodes);
        for (var i = 0; i < nodes.length; i++)
            result.push(nodes[i]);
    });
    return result;
}

function checkAnswer() {
    var nodes = getSelected(input.value);
    var targetNodes = getTargetNodes();

    function getId(node) {
        return node.getAttribute("data-id");
    }

    var nodeSet = {};
    var targetSet = {};

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        nodeSet[getId(node)] = node;
    }
    for (var i = 0; i < targetNodes.length; i++) {
        var node = targetNodes[i];
        targetSet[getId(node)] = node;
    }

    for (var i = 0; i < nodes.length; i++) {
        if (!targetSet[getId(nodes[i])])
            return;
    }
    for (var i = 0; i < targetNodes.length; i++) {
        if (!nodeSet[getId(targetNodes[i])])
            return;
    }

    console.log("correct ✓");
    completed.style.display = "inherit";
    input.classList.add("ok");
    store.set("completed."+state.level, "✓");

    var levelLink = document.querySelector("#level-link-"+state.level);
    if (levelLink)
        levelLink.classList.add("ok");
}

function showSelected() {
    errmsg.style.visibility = "hidden";
    errmsg.textContent = "_";
    clearSelected();

    if (!input.value) {
        if (!input.value)
            return;
    }
    // TODO: lookup how to detect document reloading

    var noneFound = true;
    var err;

    try {
        var nodes = getSelected(input.value);
        if (nodes.length > 0) {
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].classList.add("selected");
            }
        } else {
            errmsg.textContent = "no element found";
            errmsg.style.visibility = "inherit";
        }
    } catch (e) {
        errmsg.textContent = "invalid syntax";
        errmsg.style.visibility = "inherit";
    }
}

function setLevelNo(n) {
    var level = levels.children[n];
    if (level) {
        store.set("level", n);
        setLevel(main, n, level);

        if (state.completedLevels[n]) {
            completed.style.display = "inherit";
        } else {
            completed.style.display = "none";
        }

        var val = store.get("savedSelector."+state.level);
        input.value = val || "";
        tryInputSelector();
    } else {
        console.log("invalid level number: ", n);
    }
}

function prevLevel() {
    if (state.level > 0) {
        state.level--;
        setLevelNo(state.level);
    }
}

function nextLevel() {
    if (levels.children[state.level+1]) {
        state.level++
        setLevelNo(state.level);
    }
}

function tryInputSelector() {
    store.set("completed."+state.level, "");
    showSelected();
    checkAnswer();
    store.set("savedSelector."+state.level, input.value);
}

function buildIndex() {
    console.log("building index...")
    var index = document.querySelector("#index");
    var indexList = index.querySelector("ol");
    var children = levels.children;
    for (var i = 0; i < children.length; i++) {
        var a = document.createElement("a");
        var li = document.createElement("li");
        li.appendChild(a);
        var level = getLevelData(levels.children[i]);
        a.textContent = level.title + ": " + level.goal;

        if (store.get("completed."+i))
            a.classList.add("ok");

        a.id = "level-link-"+i;
        a.classList.add("level-link");
        a.href = "#";
        (function(no) {
            a.onclick = function() {
                state.level = no;
                setLevelNo(no);
                index.style.display = "none";
                return false;
            }
        })(i);
        indexList.appendChild(li);
    }
    index.setAttribute("data-built", "yes");
}

function showIndex() {
    var index = document.querySelector("#index");
    if (index.getAttribute("data-built") != "yes")
        buildIndex();
    index.style.display = "inherit";
}

input.addEventListener("keypress", function(e) {
    if (e.keyCode == 13) {
        tryInputSelector();
        if (store.get("completed."+state.level))
            main.querySelector("button.next").focus();
    } else if (e.keyCode == 27) {
        document.querySelector("button.enter").focus();
    }
});
main.querySelector("button.enter").onclick = function() {
    tryInputSelector();
    if (store.get("completed."+state.level))
        main.querySelector("button.next").focus();
};

main.querySelector("button.prev").onclick = prevLevel;
main.querySelector("button.next").onclick = nextLevel;
document.querySelector("#show-index").onclick = function() {
    var index = document.querySelector("#index");
    if (index.style.display == "none") {
        showIndex();
    } else {
        index.style.display = "none";
    }
}

document.addEventListener("keypress", function(e) {
    if (e.target == input)
        return;

    if (e.key == 'f')
        input.focus();
    else if (e.key == 'p')
        prevLevel();
    else if (e.key == 'n')
        nextLevel();
});

state.level = +store.get("level") || 0;
setLevelNo(state.level);
