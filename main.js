var canvas;
var context;
var vertices = [];
var vertexSize = 16;
var selectedVertex = -1;
var directed = false;
const Modes = {
	INSERT : "insert",
	REMOVE : "remove"
};
var mode = Modes.INSERT;


function initialise()
{
	canvas = document.getElementById("myCanvas");
	context = canvas.getContext("2d");
	canvas.addEventListener("mousedown", onMouseClick, false);
	redraw();
}

function redraw()
{
	context.fillStyle = "#DDDDDD";
	context.fillRect(0, 0, canvas.width, canvas.height);
	// draw edges
	for (var id = 0; id < vertices.length; ++id)
	{
		const vertex = vertices[id];
		const neighbors = vertex.edges;
		for (var i = 0; i < neighbors.length; ++i)
		{
			const neighbor = vertices[neighbors[i]];
			context.beginPath();
			context.lineWidth = 3;
			context.moveTo(vertex.x, vertex.y);
			context.lineTo(neighbor.x, neighbor.y);
			context.stroke();
		}
	}
	//draw vertices on top
	for (var id = 0; id < vertices.length; ++id)
	{
		const vertex = vertices[id];
		context.beginPath();
		context.arc(vertex.x, vertex.y, vertexSize, 0, 2*Math.PI);
		context.fillStyle = (id == selectedVertex ? "#555555" : "#BBBBBB");
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
				}
			}
			selectedVertex = -1;
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
	redraw();
}

function exportToList()
{
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