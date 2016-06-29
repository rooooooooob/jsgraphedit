"use strict";

var canvas;
var backContext;
var animContext;
var G = [];
const vertexSize = 16;
var clickedVertex = -1;
var clickedEdge = -1;
var selectedVertex = -1;
var selectedEdge = -1;
var mx = -1;
var my = -1;
var directed = false;
var edgeHighlights = {};
var vertexHighlights = {};
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
var satisfyCycles;

function initialise()
{
	canvas = document.getElementById("anim_canvas");
	animContext = canvas.getContext("2d");
	canvas.addEventListener("mousedown", onMouseDown, false);
	canvas.addEventListener("mousemove", onMouseMove, false);
	canvas.addEventListener("mouseup", onMouseUp, false);
	canvas.addEventListener("keydown", onKeyDown, false);
	var backCanvas = document.getElementById("back_canvas");
	backContext = backCanvas.getContext("2d");
	
	satisfyConnected = {
		str : "connected",
		func : isConnected
	};
	satisfyTree = {
		str : "tree",
		func : isTree
	};
	satisfyCycles = {
		str : "contains cycles",
		func : hasCycles
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

function redrawAnims()
{
	animContext.clearRect(0, 0, canvas.width, canvas.height);
	// if we're trying to add an edge, draw it to the mouse
	if (clickedVertex != -1 && selectedVertex == -1)
	{
		animContext.beginPath();
		animContext.strokeStyle = "#000000";
		animContext.lineWidth = 4;
		animContext.moveTo(G.pos[clickedVertex].x, G.pos[clickedVertex].y);
		animContext.lineTo(mx, my);
		animContext.stroke();
	}
	if (clickedVertex != -1 && clickedVertex == selectedVertex)
	{
		for (var i = 0; i < G.list[selectedVertex].length; ++i)
		{
			const v = G.list[selectedVertex][i];
			animContext.beginPath();
			animContext.strokeStyle = "#000000";
			animContext.lineWidth = 4;
			animContext.moveTo(G.pos[selectedVertex].x, G.pos[selectedVertex].y);
			animContext.lineTo(G.pos[v].x, G.pos[v].y);
			animContext.stroke();
		}
		drawVertex(animContext, selectedVertex, "#555555");
	}
}

function redraw()
{	
	backContext.fillStyle = "#DDDDDD";
	backContext.fillRect(0, 0, canvas.width, canvas.height);
	// draw edges
	for (var u = 0; u < G.list.length; ++u)
	{
		const neighbors = G.list[u];
		for (var i = 0; i < neighbors.length; ++i)
		{
			const v = neighbors[i];
			// so we don't draw each edge twice
			// and also for easily checking against selected edge
			// also don't draw the clicked down one - it is drawn in redrawAnims()
			if (u < v && u != clickedVertex && v != clickedVertex)
			{
				if (selectedEdge[0] == u && selectedEdge[1] == v)
				{
					backContext.beginPath();
					backContext.strokeStyle = "#AA0000";
					backContext.lineWidth = 9;
					backContext.moveTo(G.pos[u].x, G.pos[u].y);
					backContext.lineTo(G.pos[v].x, G.pos[v].y);
					backContext.stroke();
				}
				backContext.beginPath();
				backContext.strokeStyle = "#000000";
				backContext.lineWidth = 3;
				backContext.moveTo(G.pos[u].x, G.pos[u].y);
				backContext.lineTo(G.pos[v].x, G.pos[v].y);
				backContext.stroke();
			}
		}
	}
	// draw overlapping edge highlights as arcs going 
	// away from the main edge so that you can see them all
	var edgeHighlightCount = new Array(G.list.length);
	for (var i = 0; i < G.list.length; ++i)
	{
		// triangular array since always indexed [i][j] with i > j (or i >= j if we allow loops later)
		edgeHighlightCount[i] = new Array(i + 1);
		edgeHighlightCount[i].fill(0);
	}
	
	// draw coloured edge highlights on top
	for (var col in edgeHighlights)
	{
		for (var i = 0; i < edgeHighlights[col].length; ++i)
		{
			// this is important to get rid of potentially issues when it would
			// otherwise draw both u,v and v,u in overlapping spots  when one would
			// have one higher bezierIndex than the toher
			const u = Math.min(edgeHighlights[col][i][0], edgeHighlights[col][i][1]);
			const v = Math.max(edgeHighlights[col][i][0], edgeHighlights[col][i][1]);
			
			var bezierOffset = edgeHighlightCount[v][u];
			++(edgeHighlightCount[v][u]);
			
			
			backContext.beginPath();
			backContext.strokeStyle = col;
			backContext.lineWidth = 4;
			backContext.moveTo(G.pos[u].x, G.pos[u].y);
			if (bezierOffset == 0)
			{
				backContext.lineTo(G.pos[v].x, G.pos[v].y);
			}
			else
			{
				// flip norm across the line on odd lines so that they alternate
				const normAngle = (bezierOffset % 2 == 0) ? (Math.PI / 2) : (-Math.PI / 2);
				bezierOffset = Math.floor((bezierOffset + 1) / 2);
				const midx = (G.pos[u].x + G.pos[v].x) / 2;
				const midy = (G.pos[u].y + G.pos[v].y) / 2;
				const xdif = G.pos[v].x - G.pos[u].x;
				const ydif = G.pos[v].y - G.pos[u].y;
				const dist = Math.sqrt(xdif * xdif + ydif * ydif);
				const norm = Math.atan2(ydif, xdif) + normAngle;
				const normScalar = 3 + bezierOffset * 1.3 + bezierOffset * 0.1 * Math.pow(dist, 0.9);
				const controlx = midx + normScalar * Math.cos(norm);
				const controly = midy + normScalar * Math.sin(norm);
				backContext.quadraticCurveTo(controlx, controly, G.pos[v].x, G.pos[v].y);
			}
			backContext.stroke();
		}
	}
	// draw vertices on top
	function darkenColour(colour, lum)
	{
		// assumes 0 <= lum <= 1
		var colourNum = parseInt(colour.slice(1),16);
		var r = Math.round(((colourNum >> 16) & 0xFF) * lum)
		var g = Math.round(((colourNum >> 8) & 0xFF) * lum)
		var b = Math.round((colourNum & 0xFF) * lum)
		return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
	}
	for (var id = 0; id < G.pos.length; ++id)
	{
		// selected vertex is drawn in redrawAnims
		if (id != clickedVertex || clickedVertex != selectedVertex)
		{
			drawVertex(backContext, id, (id == selectedVertex ? "#555555" : "#BBBBBB"));
		}
	}
	for (var col in vertexHighlights)
	{
		for (var i = 0; i < vertexHighlights[col].length; ++i)
		{
			drawVertex(backContext, vertexHighlights[col][i], darkenColour(col, (vertexHighlights[col][i] == selectedVertex ? 0.4 : 0.8)));
		}
	}
}

function drawVertex(context, u, colour)
{
	context.beginPath();
	context.arc(G.pos[u].x, G.pos[u].y, vertexSize, 0, 2*Math.PI);
	context.fillStyle = colour;
	context.fill();
	context.lineWidth = 3;
	context.strokeStyle = "#000000";
	context.stroke();
	context.font = "12px Arial";
	context.lineWidth = 1;
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillStyle = "#000000";
	context.fillText(u, G.pos[u].x, G.pos[u].y);
}

function resetHighlights()
{
	edgeHighlights = {};
	vertexHighlights = {};
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

function getEdgeAt(x, y)
{
	for (var u = 0; u < G.list.length; ++u)
	{
		for (var i = 0; i < G.list[u].length; ++i)
		{
			const v = G.list[u][i];
			if (u < v) // to prevent checking the same edge twice
			{
				// project the u-mouse vector onto the u-v vector
				// then subtrct it from the mouse vector to get
				// a vector from the line to the mouse perp to the edge
				const umx = x - G.pos[u].x;
				const umy = y - G.pos[u].y;
				const uvx = G.pos[v].x - G.pos[u].x;
				const uvy = G.pos[v].y - G.pos[u].y;
				const projAmpl = (uvx*umx + uvy*umy)/(uvx*uvx + uvy*uvy);
				// if this amplitude is negative or longer than 1
				// then (x, y) is too far past or not far enough to be on the u-v line
				if (projAmpl >= 0 && projAmpl < 1)
				{
					const perpx = umx - projAmpl*uvx;
					const perpy = umy - projAmpl*uvy;
					const distToLine = Math.sqrt(perpx*perpx + perpy*perpy);
					if (distToLine <= 8 && distToLine >= -8)
					{
						// u < v so this is the canonical form already
						return [u, v];
					}
				}
			}
		}
	}
	return -1;
}

function onMouseDown(event)
{
	const x = event.clientX - canvas.getBoundingClientRect().left;
	const y = event.clientY - canvas.getBoundingClientRect().top;
	const vertexAtMouse = getVertexAt(x, y);
	if (vertexAtMouse == -1)
	{
		const edgeAtMouse = getEdgeAt(x, y);
		if (edgeAtMouse == -1)
		{
			unselect();
			redraw();
		}
		else
		{
			clickedEdge = edgeAtMouse;
		}
	}
	else
	{
		// only remove the selection if we didn't intend to move the vertex
		if (selectedVertex != vertexAtMouse)
		{
			unselect();
		}
		clickedVertex = vertexAtMouse;
		redraw();
	}
}

function onMouseMove(event)
{
	const x = event.clientX - canvas.getBoundingClientRect().left;
	const y = event.clientY - canvas.getBoundingClientRect().top;
	// check to see if the mouse is held down from a vertex
	// since otherwise we don't want to do anything
	if (clickedVertex != -1)
	{
		// we already selected the vertex - this means we want
		// to drag it around, otherwise we're trying to add an edge
		if (selectedVertex == clickedVertex)
		{
			G.pos[selectedVertex].x = x;
			G.pos[selectedVertex].y = y;
		}
		else // we're trying to add an edge, so draw that
		{
			// drawing this edge is handled in redraw()
			mx = x;
			my = y;
		}
		redrawAnims();
	}
}

function onMouseUp(event)
{
	const x = event.clientX - canvas.getBoundingClientRect().left;
	const y = event.clientY - canvas.getBoundingClientRect().top;
	if (clickedEdge != -1)
	{
		if (selectedEdge[0] == clickedEdge[0] && selectedEdge[1] == clickedEdge[1])
		{
			unselect();
		}
		else
		{
			selectEdge(clickedEdge[0], clickedEdge[1]);
		}
		redraw();
	}
	else
	{
		const vertexAtMouse = getVertexAt(x, y);
		// didn't click on vertex -> create new vertex
		if (vertexAtMouse == -1)
		{
			if (clickedVertex == -1 && selectedVertex == -1)
			{
				resetHighlights();
				addVertex(G, x, y);
			}
			if (selectedVertex != -1)
			{
				unselect();
			}
		}
		else // mouse over a vertex -> add edge if dragged to another vertex
		{
			if (clickedVertex != -1)
			{
				// no self-loops
				if (vertexAtMouse != clickedVertex)
				{
					resetHighlights();
					addEdge(G, clickedVertex, vertexAtMouse);
					clickedVertex = vertexAtMouse;
				}
				else
				{
					if (selectedVertex == clickedVertex)
					{
						unselect();
					}
					else
					{
						selectVertex(clickedVertex);
					}
				}
			}
			else
			{
				unselect();
			}
		}	
	}
	clickedVertex = -1;
	clickedEdge = -1;
	redraw();
	redrawAnims();
}

function onKeyDown(event)
{
	//if (event.keyCode == 46) // delete
	{
		removeSelected();
	}
}

function selectVertex(vertex)
{
	selectedVertex = vertex;
	selectedEdge = -1;
	document.getElementById("remove_selected_id").disabled = false;
}

function selectEdge(u, v)
{
	selectedVertex = -1;
	selectedEdge = [u, v];
	document.getElementById("remove_selected_id").disabled = false;
}

function unselect()
{
	selectedVertex = -1;
	selectedEdge = -1;
	document.getElementById("remove_selected_id").disabled = true;
}

function clearGraph()
{
	G = createGraph(0);
	
	resetHighlights();
	
	redraw();
}

function removeSelected()
{
	if (selectedVertex != -1)
	{
		removeVertex(G, selectedVertex);
	}
	else if (selectedEdge != -1)
	{
		removeEdge(G, selectedEdge[0], selectedEdge[1]);
	}
	else
	{
		alert("Uh oh, how did you click remove selected without selecting something?");
	}
	
	unselect();
	
	resetHighlights();
		
	redraw();
}

function readFromList()
{
	G = createGraph(0);
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
	
	resetHighlights();
	
	redraw();
}

function exportToList()
{
	var output = G.list.length + "\n";
	for (var i = 0; i < G.list.length; ++i)
	{
		output += G.list[i].length;
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
			break;
		}
		else if (seq[i] < 0 || seq >= seq.length + 2)
		{
			alert("elements must in the range [0, n) for a sequence of length n - 2 to generate a tree on n vertices with (n = " + seq.length + 2 + ")");
			failed = true;
			break;
		}
	}
	if (!failed)
	{
		G = fromPrufer(seq);
		
		resetHighlights();
		
		randomizeVertexPositions();
		
		redraw();
	}
}

function exportPrufer()
{
	if (require(G, [satisfyTree], []))
	{
		document.getElementById("prufer_textbox_id").value = toPrufer(G).join(" ");
	}
}

function importUppertri()
{
	var input = document.getElementById("upper_tri_textbox_id").value.split(" ");
	var failed = false;
	if (input.length != 2)
	{
		alert("Input must be the number of vertices followed by adjacencies");
		failed = true;
	}
	else
	{
		const n = parseInt(input[0], 10);
		if (n == NaN)
		{
			alert("Number of vertices must be a number");
			failed = true;
		}
		else if (n * (n - 1) / 2 != input[1].length)
		{
			alert("Number of vertices must be equal to the size of an upper-triangular adjacency matrix specified next without whitespace ie 3 111 is K_3 and 4 101101 is C_4 and 4 100101 is P_4");
			failed = true;
		}
		for (var i = 0; i < input[1].length; ++i)
		{
			if (input[1][i] != '0' && input[1][i] != '1')
			{
				alert("Adjacencies must contain only 0s and 1s");
				failed = true;
				break;
			}
		}
	}
	if (!failed)
	{
		const n = parseInt(input[0], 10);
		G = createGraph(n);
		var i = 0;
		for (var r = 0; r < n; ++r)
		{
			for (var c = r + 1; c < n; ++c)
			{
				if (input[1][i++] == '1')
				{
					addEdge(G, r, c);
				}
			}
		}
	
		resetHighlights();
	
		randomizeVertexPositions();
	
		redraw();
	}
}

function exportUppertri()
{
	const n = G.list.length;
	var str = n + " ";
	for (var r = 0; r < n; ++r)
	{
		for (var c = r + 1; c < n; ++c)
		{
			str += hasEdge(G, r, c) ? '1' : '0';
		}
	}
	document.getElementById("upper_tri_textbox_id").value = str;
}

function runTwopathDecomp()
{
	var evenSize = {
		str : "even size",
		func : function(G) { return countEdges(G) % 2 == 0; }
	};
	if (require(G, [satisfyConnected, evenSize], []))
	{
		var outputBox = document.getElementById("output_textbox_id");
		outputBox.value = "3-paths: ";
	
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
			
			if (i > 0)
			{
				outputBox.value += ", ";
			}
			outputBox.value += twopaths[i][0][0] + "-" + twopaths[i][0][1] + "-" + twopaths[i][1][1];
		}
		
		redraw();
	}
}

function runComplement()
{
	resetHighlights();
	
	G = complement(G);
	
	redraw();
}

function runBFS()
{
	resetHighlights();
	
	var outputBox = document.getElementById("output_textbox_id");
	outputBox.value = "";
	
	var visited = new Array(G.list.length);
	visited.fill(false);
	var component = 1;
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
			if (!vertexHighlights[key])
			{
				vertexHighlights[key] = [];
			}
			for (var j = 0; j < bfsTree.length; ++j)
			{
				visited[bfsTree[j][1]] = true;
				// don't draw first edge, since it's [null, start]
				if (j > 0)
				{
					edgeHighlights[key].push(bfsTree[j]);
				}
				vertexHighlights[key].push(bfsTree[j][1]);
			}
			outputBox.value += "Component" + component + ": ";
			for (var j = 0; j < bfsTree.length; ++j)
			{
				if (j > 0)
				{
					outputBox.value +=  ", ";
				}
				outputBox.value += bfsTree[j][1];
			}
			outputBox.value += "\n";
			++component;
		}
	}
	
	redraw();
}

function runDFS()
{
	resetHighlights();
	
	var outputBox = document.getElementById("output_textbox_id");
	outputBox.value = "";
	
	var visited = new Array(G.list.length);
	visited.fill(false);
	var component = 1;
	for (var i = 0; i < G.list.length; ++i)
	{
		if (!visited[i])
		{
			const dfsTree = dfs(G, i, wholeEdge);
			const key = randomColours[(lastRandomColourIndex++) % randomColours.length];
			if (!edgeHighlights[key])
			{
				edgeHighlights[key] = [];
			}
			if (!vertexHighlights[key])
			{
				vertexHighlights[key] = [];
			}
			for (var j = 0; j < dfsTree.length; ++j)
			{
				visited[dfsTree[j][1]] = true;
				// don't draw first edge, since it's [null, start]
				if (j > 0)
				{
					edgeHighlights[key].push(dfsTree[j]);
				}
				vertexHighlights[key].push(dfsTree[j][1]);
			}
			outputBox.value += "Component" + component + ": ";
			for (var j = 0; j < dfsTree.length; ++j)
			{
				if (j > 0)
				{
					outputBox.value +=  ", ";
				}
				outputBox.value += dfsTree[j][1];
			}
			outputBox.value += "\n";
			++component;
		}
	}
	
	redraw();
}

function runVertexColour()
{
	resetHighlights();
	
	var outputBox = document.getElementById("output_textbox_id");
	
	var colouring = vertexColouring(G);
	
	var colours = 0;
	for (var i = 0; i < colouring.length; ++i)
	{
		if (colouring[i] + 1 > colours)
		{
			colours = colouring[i] + 1;
		}
		const key = randomColours[colouring[i] % randomColours.length];
		if (!vertexHighlights[key])
		{
			vertexHighlights[key] = [];
		}
		vertexHighlights[key].push(i);
	}
	
	outputBox.value = colours + "-colourable using " + colouring + "\n";
	
	redraw();
}

function runCycleAnalyze()
{
	if (require(G, [satisfyCycles], []))
	{
		var outputBox = document.getElementById("output_textbox_id");
	
		resetHighlights();
		
		const cycles = computeMinCycles(G);
		
		const girth = cycles[0].length;
		outputBox.value = "Girth: " + girth;
		
		for (var i = 0; i < cycles.length; ++i)
		{
			const key = randomColours[i % randomColours.length];
			if (!edgeHighlights[key])
			{
				edgeHighlights[key] = [];
			}
			for (var j = 0; j < cycles[i].length; ++j)
			{
				const u = cycles[i][j];
				const v = cycles[i][(j + 1) % girth];
				edgeHighlights[key].push([u, v]);
			}
			outputBox.value += ", [" + cycles[i] + "]";
		}
		redraw();
	}
}

function menuAlgorithmChanged()
{
	switch (document.getElementById("menu_algorithm_select_id").value)
	{
		case "3pathdecomp":
			break;
		case "complement":
			break;
		case "bfs":
			break;
		case "dfs":
			break;
		case "vertex_colour":
			break;
		case "min_cycles":
			break;
	}
}

function menuAlgorithmRun()
{
	switch (document.getElementById("menu_algorithm_select_id").value)
	{
		case "3pathdecomp":
			runTwopathDecomp();
			break;
		case "complement":
			runComplement();
			break;
		case "bfs":
			runBFS();
			break;
		case "dfs":
			runDFS();
			break;
		case "vertex_colour":
			runVertexColour();
			break;
		case "min_cycles":
			runCycleAnalyze();
			break;
	}
}

function menuGenerate(genFunc, settings)
{
	const n = parseInt(document.getElementById("gen_vertices_id").value)

	if (n != NaN)
	{
		var settings = settings || {};	
		settings.n = n;
	
		G = genFunc(settings);
		
		resetHighlights();

		randomizeVertexPositions();
		
		redraw();
	}
	else
	{
		alert("please enter a number for vertices");
	}
}

function require(G, conditions, forbidden)
{
	var failed = [];
	for (var i = 0; i < conditions.length; ++i)
	{
		if (!conditions[i].func(G))
		{
			failed.push(conditions[i].str);
		}
	}
	for (var i = 0; i < forbidden.length; ++i)
	{
		if (forbidden[i].func(G))
		{
			failed.push("NOT " + forbidden[i].str);
		}
	}
	if (failed.length > 0)
	{
		alert("Graph must satisfy: " + failed.join(", "));
	}
	return failed.length == 0;
}

function menuGenerateClicked()
{
	var type = document.getElementById("menu_generate_select_id");
	switch (type.options[type.selectedIndex].value)
	{
		case "tree":
			menuGenerate(generateTree);
			break;
		case "connected":
			menuGenerate(generateConnected);
			break;
		case "complete":
			menuGenerate(generateComplete);
			break;
		case "hamiltonian":
			menuGenerate(generateHamiltonian);
			break;
		case "permutation":
			menuGenerate(generatePermutationGraph);
			break;
		case "split":
			menuGenerate(generateSplit);
			break;
		case "chordal":
			menuGenerate(generateChordal);
			break;
		case "random":
			menuGenerate(generateCompletelyRandom)
			break;
	}
}

function menuGenerateChanged()
{
	var helpURL = document.getElementById("menu_generate_info_id");
	var type = document.getElementById("menu_generate_select_id");
	switch (type.options[type.selectedIndex].value)
	{
		case "tree":
			helpURL.href = "https://en.wikipedia.org/wiki/Tree_%28graph_theory%29";
			break;
		case "connected":
			helpURL.href = "https://en.wikipedia.org/wiki/Connectivity_%28graph_theory%29#Connected_graph";
			break;
		case "complete":
			helpURL.href = "https://en.wikipedia.org/wiki/Complete_graph";
			break;
		case "hamiltonian":
			helpURL.href = "https://en.wikipedia.org/wiki/Hamiltonian_path";
			break;
		case "permutation":
			helpURL.href = "https://en.wikipedia.org/wiki/Permutation_graph";
			break;
		case "split":
			helpURL.href = "https://en.wikipedia.org/wiki/Split_graph";
			break;
		case "chordal":
			helpURL.href = "https://en.wikipedia.org/wiki/Chordal_graph";
			break;
		case "random":
			helpURL.href = "";
			break;
	}
}

function randomizeVertexPositions()
{
	for (var u = 0; u < G.list.length; ++u)
	{
		G.pos[u].x = Math.random() * canvas.width;
		G.pos[u].y = Math.random() * canvas.height;
	}
}