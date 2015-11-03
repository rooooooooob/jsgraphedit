"use strict";

var canvas;
var context;
var G = [];
const vertexSize = 16;
var selectedVertex = -1;
var directed = false;
const Modes = {
	INSERT : "insert",
	REMOVE : "remove",
	MOVE : "move"
};
var mode = Modes.INSERT;
var edgeHighlights = {};
var lastRandomColourIndex = 0;
const randomColours = [
	"#FF0000",
	"#0000FF",
	"#00AA00",
	"#FF00FF",
	"#00AAAA",
	"#800000",
	"#FFAA00",
	"#FFFF00",
	"#8A2BE2",
	"#7FFF00",
	"#BDB76B",
	"#FF7F50",
	"#7FFFD4",
	"#4B0082",
	"#90EE90"
];
var satisfyConnected;
var satisfyTree;

function initialise()
{
	canvas = document.getElementById("myCanvas");
	context = canvas.getContext("2d");
	canvas.addEventListener("mousedown", onMouseClick, false);
	
	satisfyConnected = {
		str : "connected",
		func : isConnected
	};
	satisfyTree = {
		str : "tree",
		func : isTree
	};
		
	
	//readFromList();
	G = generateConnected({n: 13});
	const m = countEdges(G);
	if (m % 2 == 1)
	{
		// add or remove an edge - we can keep it connected if it's complete by removing, else add one
		if (m == G.list.length * (G.list.length - 1) / 2)
		{
			removeEdge(G, 0, 1);
		}
		else
		{
			placeRandomEdge(G);
		}
	}
	randomizeVertexPositions();
	
	
	redraw();
}

function redraw()
{
	context.fillStyle = "#DDDDDD";
	context.fillRect(0, 0, canvas.width, canvas.height);
	// draw edges
	for (var id = 0; id < G.list.length; ++id)
	{
		const neighbors = G.list[id];
		for (var i = 0; i < neighbors.length; ++i)
		{
			context.beginPath();
			context.strokeStyle = "#000000";
			context.lineWidth = 3;
			context.moveTo(G.pos[id].x, G.pos[id].y);
			context.lineTo(G.pos[neighbors[i]].x, G.pos[neighbors[i]].y);
			context.stroke();
		}
	}
	// draw coloured edge highlights on top
	for (var col in edgeHighlights)
	{
		for (var i = 0; i < edgeHighlights[col].length; ++i)
		{
			const u = edgeHighlights[col][i][0];
			const v = edgeHighlights[col][i][1];
			context.beginPath();
			context.strokeStyle = col;
			context.lineWidth = 4;
			context.moveTo(G.pos[u].x, G.pos[u].y);
			context.lineTo(G.pos[v].x, G.pos[v].y);
			context.stroke();
		}
	}
	// draw vertices on top
	for (var id = 0; id < G.pos.length; ++id)
	{
		context.beginPath();
		context.arc(G.pos[id].x, G.pos[id].y, vertexSize, 0, 2*Math.PI);
		context.fillStyle = (id == selectedVertex ? "#555555" : "#BBBBBB");
		if (isCut(G, id))
			context.fillStyle = (id == selectedVertex ? "#770000" : "#CC0000");
		context.fill();
		context.lineWidth = 3;
		context.strokeStyle = "#000000";
		context.stroke();
		context.font = "12px Arial";
		context.lineWidth = 1;
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillStyle = "#000000";
		context.fillText(id, G.pos[id].x, G.pos[id].y);
	}
}

function getVertexAt(x, y)
{
	for (var id = 0; id < G.list.length; ++id)
	{
		const difX = G.pos[id].x - x;
		const difY = G.pos[id].y - y;
		if (Math.sqrt(difX*difX + difY*difY) <= vertexSize)
		{
			return id;
		}
	}
	return -1;
}

function onMouseClick(event)
{
	const x = event.clientX - canvas.getBoundingClientRect().left;
	const y = event.clientY - canvas.getBoundingClientRect().top;
	const vertexClickedOn = getVertexAt(x, y);
	// didn't click on vertex -> create new vertex
	if (vertexClickedOn == -1)
	{
		switch (mode)
		{
		case Modes.INSERT:
			const addedVertex = addVertex(G, x, y);
			if (selectedVertex != -1)
			{
				addEdge(G, selectedVertex, addedVertex);
			}
			break;
		case Modes.REMOVE:
			selectedVertex = -1;
			break;
		case Modes.MOVE:
			if (selectedVertex != -1)
			{
				G.pos[selectedVertex].x = x;
				G.pos[selectedVertex].y = y;
				selectedVertex = -1;
			}
			break;
		}
	}
	else // selected a vertex -> select or create edge between previous selected vertex
	{
		if (selectedVertex != -1)
		{
			// no self-loops
			if (vertexClickedOn != selectedVertex)
			{
				switch (mode)
				{
				case Modes.INSERT:
					addEdge(G, selectedVertex, vertexClickedOn);
					selectedVertex = vertexClickedOn;
					break;
				case Modes.REMOVE:
					removeEdge(G, selectedVertex, vertexClickedOn);
					break;
				}
			}
			else // delete vertex
			{
				if (mode == Modes.REMOVE)
				{
					removeVertex(G, selectedVertex);
					selectedVertex = -1;
				}
				selectedVertex = -1;
			}
		}
		else
		{
			selectedVertex = vertexClickedOn;
		}
	}
	
	
	redraw();
}

function readFromList()
{
	G = []
	var inputs = document.getElementById("adj_list_textbox_id").value.match(/\S+/g).map(function(str) { return parseInt(str, 10) });
	const badIndex = inputs.indexOf(NaN);
	if (badIndex != -1)
	{
		alert("could not read parameter " + badIndex);
		return;
	}
	for (var i = 0; i < inputs[0]; ++i)
	{
		addVertex(G, Math.random() * canvas.width, Math.random() * canvas.height);
	}
	var currentVertex = 0;
	var index = 1;
	const n = inputs[0];
	for ( ; currentVertex < n ; )
	{
		const degree = inputs[index++];
		for (var j = 0; j < degree; ++j)
		{
			addEdge(G, currentVertex, inputs[index++]);
		}
		++currentVertex;
	}
	edgeHighlights = {};
	redraw();
}

function exportToList()
{
	var output = G.list.length + "\n";
	for (var i = 0; i < G.list.length; ++i)
	{
		output += " " + G.list[i].length;
		for (var j = 0; j < G.list[i].length; ++j)
		{
			output += " " + G.list[i][j];
		}
		output += "\n";
	}
	document.getElementById("adj_list_textbox_id").value = output;
}

function importPrufer()
{
	var seq = document.getElementById("prufer_textbox_id").value.match(/\S+/g).map(function(str) { return parseInt(str, 10) });
	var failed = false;
	for (var i = 0; i < seq.length; ++i)
	{
		if (seq[i] == NaN)
		{
			alert("elements in sequence must be numbers separated by whitespace");
			failed = true;
		}
		else if (seq[i] < 0 || seq >= seq.length + 2)
		{
			alert("elements must in the range [0, n) for a sequence of length n - 2 to generate a tree on n vertices with (n = " + seq.length + 2 + ")");
			failed = true;
		}
	}
	if (!failed)
	{
		G = fromPrufer(seq);
		
		edgeHighlights = {};
		
		randomizeVertexPositions();
		
		redraw();
	}
}

function exportPrufer()
{
	if (require(G, [satisfyTree]))
	{
		document.getElementById("prufer_textbox_id").value = toPrufer(G).join(" ");
	}
}

function runTwopathDecomp()
{
	var evenSize = {
		str : "even size",
		func : function(G) { return countEdges(G) % 2 == 0; }
	};
	if (require(G, [satisfyConnected, evenSize]))
	{
		edgeHighlights = {};
		var twopaths = twopathDecompose(G);
		for (var i = 0; i < twopaths.length; ++i)
		{
			const key = randomColours[(lastRandomColourIndex++) % randomColours.length];
			if (!edgeHighlights[key])
			{
				edgeHighlights[key] = [];
			}
			for (var j = 0; j < twopaths[i].length; ++j)
			{
				edgeHighlights[key].push(twopaths[i][j]);
			}
		}
		
		redraw();
	}
}

function runComplement()
{
	edgeHighlights = {};
	G = complement(G);
	redraw();
}

function runBFS()
{
	edgeHighlights = {};
	
	var visited = new Array(G.list.length);
	visited.fill(false);
	for (var i = 0; i < G.list.length; ++i)
	{
		if (!visited[i])
		{
			const bfsTree = bfs(G, i, wholeEdge);
			const key = randomColours[(lastRandomColourIndex++) % randomColours.length];
			if (!edgeHighlights[key])
			{
				edgeHighlights[key] = [];
			}
			for (var j = 0; j < bfsTree.length; ++j)
			{
				visited[bfsTree[j][1]] = true;
				// don't draw first edge, since it's [null, start]
				if (j > 0)
				{
					edgeHighlights[key].push(bfsTree[j]);
				}
			}
		}
	}
	
	redraw();
}

function menuGenerate(genFunc, settings, conditions)
{
	const n = parseInt(document.getElementById("gen_vertices_id").value)

	if (n != NaN)
	{
		var settings = settings || {};	
		settings.n = n;
	
		G = genFunc(settings);
		
		edgeHighlights = {};

		randomizeVertexPositions();
		
		redraw();
	}
	else
	{
		alert("please enter a number for vertices");
	}
}

function require(G, conditions)
{
	var failed = [];
	for (var i = 0; i < conditions.length; ++i)
	{
		if (!conditions[i].func(G))
		{
			failed.push(conditions[i].str);
		}
	}
	if (failed.length > 0)
	{
		alert("Graph must satisfy: " + failed.join(", "));
	}
	return failed.length == 0;
}

function menuGenerateTree()
{
	menuGenerate(generateTree);
}

function menuGenerateConnected()
{
	menuGenerate(generateConnected);
}

function menuGenerateComplete()
{
	menuGenerate(generateComplete);
}

function menuGenerateHamiltonian()
{
	menuGenerate(generateHamiltonian);
}

function menuGeneratePermutationGraph()
{
	menuGenerate(generatePermutationGraph);
}

function menuGenerateSplit()
{
	menuGenerate(generateSplit);
}

function menuGenerateChordal()
{
	menuGenerate(generateChordal);
}

function setMode(newMode)
{
	mode = newMode;
}

function setModeToInsert()
{
	setMode(Modes.INSERT);
}

function setModeToRemove()
{
	setMode(Modes.REMOVE);
}

function setModeToMove()
{
	setMode(Modes.MOVE);
}

function randomizeVertexPositions()
{
	for (var u = 0; u < G.list.length; ++u)
	{
		G.pos[u].x = Math.random() * canvas.width;
		G.pos[u].y = Math.random() * canvas.height;
	}
}