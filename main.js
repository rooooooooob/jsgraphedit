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
var isVertexDrawn;
var isDrawingSubgraph;

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
	isVertexDrawn = [];
	isDrawingSubgraph = false;
	
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
	
	resetHighlights();
	
	redraw();
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
				// don't draw first edge, since it's [-1, start]
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

function runCircularCompletion()
{
	vertexHighlights = {};
	
	var paired = circularComplete(removeTrueTwinsAndUniversal(G));
	
	const oldN = G.list.length;
	
	G = paired[0];
	
	var outputBox = document.getElementById("output_textbox_id");
	outputBox.value = "CircularPairs "
	
	for (var i = 0; i < paired[1].length; ++i)
	{
		const key = randomColours[i % randomColours.length];
		if (!vertexHighlights[key])
		{
			vertexHighlights[key] = [];
		}
		const u = paired[1][i][0];
		const v=  paired[1][i][1];
		vertexHighlights[key].push(u, v);
		outputBox.value += ", (" + u + "," + v + ")"
	}
	
	for (var u = oldN; u < G.list.length; ++u)
	{
		G.pos[u].x = Math.random() * canvas.width;
		G.pos[u].y = Math.random() * canvas.height;
	}
	
	redraw();
}

function runComputeEdgeTypes()
{
	edgeHighlights = {};
	
	const n = G.list.length;
	
	const types = computeEdgeTypes(G);
	
	var inclusionEdges = [];
	
	for (var u = 0; u < n; ++u)
	{
		for (var v = u + 1; v < n; ++v)
		{
			if (types[u][v] == EdgeType.INCLUSION)
			{
				inclusionEdges.push([u, v]);
			}
		}
	}
	
	const key = randomColours[(lastRandomColourIndex++) % randomColours.length];
	edgeHighlights[key] = inclusionEdges;
	
	redraw();
}

function runRemoveTTU()
{
	resetHighlights();
	
	G = removeTrueTwinsAndUniversal(G);
	
	redraw();
}

function runFindAnchoredInvertiblePair(useAlternate)
{
	resetHighlights();

	// todo: draw aop in highlights?
	const aop = useAlternate ? findAnchoredInvertiblePairAlt(G) : findAnchoredInvertiblePair(G);
	const completion = aop[0];
	const types = aop[1];
	const z = aop[2];
	const P = aop[3];
	const Q = aop[4];
	
	var outputBox = document.getElementById("output_textbox_id");
	outputBox.value = "z = " + z + "\n";
	
	function printPath(name, path)
	{	outputBox.value += name + ": ";
		for (var i = 0; i < path.length; ++i)
		{
			outputBox.value += path[i] + ", ";
		}
		outputBox.value += "\n";
	}
	printPath("P", P);
	printPath("Q", Q);
	
	G = completion;
	
	randomizeVertexPositions();
	
	const vertexKey = randomColours[(lastRandomColourIndex++) % randomColours.length];
	vertexHighlights[vertexKey] = [z];
	
	function highlightPath(path)
	{
		const key = randomColours[(lastRandomColourIndex++) % randomColours.length];
		edgeHighlights[key] = [];
		for (var i = 0; i < path.length - 1; ++i)
		{
			edgeHighlights[key].push([path[i], path[i + 1]]);
		}
	}
	highlightPath(P);
	highlightPath(Q);
	
	/*const oddCycle = aop[5];
	if (oddCycle.length > 0)
	{
		const key = randomColours[(lastRandomColourIndex++) % randomColours.length];
		var oddCycleEdges = [];
		for (var i = 0; i < oddCycle.length; ++i)
		{
			oddCycleEdges.push([oddCycle[i], oddCycle[(i + 1) % oddCycle.length]]);
		}
		edgeHighlights[key] = oddCycleEdges;
	}*/
	
	redraw();
}

function analayzeCompletion()
{
	resetHighlights();
	
	var paired = circularComplete(removeTrueTwinsAndUniversal(G));
	
	G = paired[0];
	runComputeEdgeTypes();
	const n = G.list.length;
	
	var outputBox = document.getElementById("output_textbox_id");
	outputBox.value = "CircularPairs "
	
	for (var i = 0; i < paired[1].length; ++i)
	{
		const key = randomColours[i % randomColours.length];
		if (!vertexHighlights[key])
		{
			vertexHighlights[key] = [];
		}
		const u = paired[1][i][0];
		const v=  paired[1][i][1];
		vertexHighlights[key].push(u, v);
		outputBox.value += ", (" + u + "," + v + ")"
	}
	
	var z = 0;
	for (var i = 1; i < G.list.length; ++i)
	{
		if (G.list[i].length < G.list[z].length)
		{
			z = i;
		}
	}
	
	var cpair = new Array(n);
	for (var i = 0; i < paired[1].length; ++i)
	{
		const ui = paired[1][i][0];
		const uibar = paired[1][i][1];
		cpair[ui] = uibar;
		cpair[uibar] = ui;
	}
	
	G.pos[z].x = canvas.width / 2;
	G.pos[z].y = 16;
	
	const zbar = cpair[z];
	G.pos[zbar].x = canvas.width / 2;
	G.pos[zbar].y = canvas.height - 16;
	
	isVertexDrawn[z] = false;
	isVertexDrawn[zbar] = true;
	
	const zdeg = G.list[z].length;
	for (var i = 0; i < zdeg; ++i)
	{
		const u = G.list[z][i];
		const ubar = cpair[u];
		const ux = (0.5 + i) * (canvas.width / zdeg);
		if (hasEdge(G, z, ubar)) // u/ubar in (2)
		{
			//if (u < ubar)
			//{
			//	
			//}
			
			G.pos[u].x = ux;
			G.pos[u].y = canvas.height / 2;
			isVertexDrawn[u] = true;
		}
		else // u in (1), ubar in (2)
		{
			const yoff = 128 - 64 * ((Math.abs(zdeg / 2 - i)) / (zdeg / 2));
			G.pos[u].x = ux;
			G.pos[u].y = yoff;
			G.pos[ubar].x = ux;
			G.pos[ubar].y = canvas.height - yoff;
			isVertexDrawn[u] = false;
			isVertexDrawn[ubar] = true;
		}
		
	}
	
	redraw();
}

function toggleSubgraphDraw()
{
	var div = document.getElementById("subgraph_checkboxes_id");
	var button = document.getElementById("draw_subgraph_button_id");
	if (isDrawingSubgraph)
	{
		isDrawingSubgraph = false;
		button.innerHTML = "Draw Subgraph";
		while (div.hasChildNodes())
		{
			div.removeChild(div.lastChild);
		}
	}
	else
	{
		isDrawingSubgraph = true;
		button.innerHTML = "Entire Graph";
		const tableWidth = 32;
		var table = document.createElement("table");
		//table.border = 1;
		var row;
		for (var i = 0; i < G.list.length; ++i)
		{
			if (i % tableWidth == 0)
			{
				row = table.insertRow(-1);
			}
			const id = "vertex_checkbox_" + i;
			
			//var text = document.createElement("label");
			//text.setAttribute("for", id);
			//text.innerHTML = ";   " + i.toString();
			//box.appendChild(text);
			var text = row.insertCell(-1);
			text.align = "center";
			text.innerHTML = i.toString() + "<br>";
			
			var checkbox = document.createElement("input");
			checkbox.setAttribute("type", "checkbox");
			checkbox.setAttribute("id", id);
			checkbox.checked = isVertexDrawn[i];
			checkbox.onclick = (function(i, checkbox) {
				return function() {
					isVertexDrawn[i] = checkbox.checked;
					redraw();
				}
			})(i, checkbox);
			text.appendChild(checkbox);
		}
		div.appendChild(table);
	}
	redraw();
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
		case "circular_completion":
			break;
		case "compute_edge_types":
			break;
		case "remove_ttu":
			break;
		case "find_anchored_invertible_pair":
			break;
		case "find_anchored_invertible_pair2":
			break;
		case "analayze_completion":
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
		case "circular_completion":
			runCircularCompletion();
			break;
		case "compute_edge_types":
			runComputeEdgeTypes();
			break;
		case "remove_ttu":
			runRemoveTTU();
			break;
		case "find_anchored_invertible_pair":
			runFindAnchoredInvertiblePair(false);
			break;
		case "find_anchored_invertible_pair2":
			runFindAnchoredInvertiblePair(true);
			break;
		case "analayze_completion":
			analayzeCompletion();
			break;
	}
}

function menuGenerate(genFunc, settings)
{
	const n = parseInt(document.getElementById("gen_vertices_id").value)

	if (!isNaN(n))
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
			menuGenerate(generateCompletelyRandom);
			break;
		case "circulararc":
			menuGenerate(generateCircularArc);
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
		case "circulararc":
			helpURL.href = "https://en.wikipedia.org/wiki/Circular-arc_graph";
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