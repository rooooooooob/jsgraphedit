"use strict";

var canvas;
var context;
var vertices = [];
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


function initialise()
{
	canvas = document.getElementById("myCanvas");
	context = canvas.getContext("2d");
	canvas.addEventListener("mousedown", onMouseClick, false);
	
	//readFromList();
	vertices = generateConnected({n: 13});
	const m = countEdges(vertices);
	if (m % 2 == 1)
	{
		// add or remove an edge - we can keep it connected if it's complete by removing, else add one
		if (m == vertices.length * (vertices.length - 1) / 2)
		{
			removeEdge(vertices, 0, 1);
		}
		else
		{
			placeRandomEdge(vertices);
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
	for (var id = 0; id < vertices.length; ++id)
	{
		let vertex = vertices[id];
		const neighbors = vertex.edges;
		for (var i = 0; i < neighbors.length; ++i)
		{
			const neighbor = vertices[neighbors[i]];
			context.beginPath();
			context.strokeStyle = "#000000";
			context.lineWidth = 3;
			context.moveTo(vertex.x, vertex.y);
			context.lineTo(neighbor.x, neighbor.y);
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
			context.moveTo(vertices[u].x, vertices[u].y);
			context.lineTo(vertices[v].x, vertices[v].y);
			context.stroke();
		}
	}
	// draw vertices on top
	for (var id = 0; id < vertices.length; ++id)
	{
		let vertex = vertices[id];
		context.beginPath();
		context.arc(vertex.x, vertex.y, vertexSize, 0, 2*Math.PI);
		context.fillStyle = (id == selectedVertex ? "#555555" : "#BBBBBB");
		if (isCut(vertices, id))
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
		context.fillText(id, vertex.x, vertex.y);
	}
}

function getVertexAt(x, y)
{
	for (var id = 0; id < vertices.length; ++id)
	{
		const vertex = vertices[id];
		const difX = vertex.x - x;
		const difY = vertex.y - y;
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
			const addedVertex = addVertex(vertices, x, y);
			if (selectedVertex != -1)
			{
				addEdge(vertices, selectedVertex, addedVertex);
			}
			break;
		case Modes.REMOVE:
			selectedVertex = -1;
			break;
		case Modes.MOVE:
			if (selectedVertex != -1)
			{
				vertices[selectedVertex].x = x;
				vertices[selectedVertex].y = y;
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
					addEdge(vertices, selectedVertex, vertexClickedOn);
					selectedVertex = vertexClickedOn;
					break;
				case Modes.REMOVE:
					removeEdge(vertices, selectedVertex, vertexClickedOn);
					break;
				}
			}
			else // delete vertex
			{
				if (mode == Modes.REMOVE)
				{
					removeVertex(vertices, selectedVertex);
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
	vertices = []
	var inputs = document.getElementById("adj_list_textbox_id").value.match(/\S+/g).map(function(str) { return parseInt(str, 10) });
	const badIndex = inputs.indexOf(NaN);
	if (badIndex != -1)
	{
		alert("could not read parameter " + badIndex);
		return;
	}
	for (var i = 0; i < inputs[0]; ++i)
	{
		addVertex(vertices, Math.random() * canvas.width, Math.random() * canvas.height);
	}
	var currentVertex = 0;
	var index = 1;
	const n = inputs[0];
	for ( ; currentVertex < n ; )
	{
		const degree = inputs[index++];
		for (var j = 0; j < degree; ++j)
		{
			addEdge(vertices, currentVertex, inputs[index++]);
		}
		++currentVertex;
	}
	edgeHighlights = {};
	redraw();
}

function exportToList()
{
	var output = vertices.length + "\n";
	for (var i = 0; i < vertices.length; ++i)
	{
		output += " " + vertices[i].edges.length;
		for (var j = 0; j < vertices[i].edges.length; ++j)
		{
			output += " " + vertices[i].edges[j];
		}
		output += "\n";
	}
	document.getElementById("adj_list_textbox_id").value = output;
}

function runTwopathDecomp()
{
	edgeHighlights = {};
	var twopaths = twopathDecompose(vertices);
	for (var i = 0; i < twopaths.length; ++i)
	{
		const key = randomColours[(lastRandomColourIndex++) % randomColours.length];
		for (var j = 0; j < twopaths[i].length; ++j)
		{
			if (!edgeHighlights[key])
			{
				edgeHighlights[key] = [];
			}
			edgeHighlights[key].push(twopaths[i][j]);
		}
	}
	
	redraw();
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
	for (var u = 0; u < vertices.length; ++u)
	{
		vertices[u].x = Math.random() * canvas.width;
		vertices[u].y = Math.random() * canvas.height;
	}
}