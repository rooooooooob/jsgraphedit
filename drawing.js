"use strict";

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
	// if we're moving a vertex, draw all its edges
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
			if (!isDrawingSubgraph || (isVertexDrawn[u] && isVertexDrawn[v]))
			{
			
				// u < v so we don't draw each edge twice
				// and also for easily checking against selected edge
				// also don't draw the clicked down one - it is drawn in redrawAnims()
				// but only if we're moving it!!!			
				if (u < v && (u != clickedVertex && v != clickedVertex) || selectedVertex == -1)
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
			if (!isDrawingSubgraph || (isVertexDrawn[u] && isVertexDrawn[v]))
			{
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
	if (!isDrawingSubgraph || isVertexDrawn[u])
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
}

function resetHighlights()
{
	edgeHighlights = {};
	vertexHighlights = {};
	isVertexDrawn = new Array(G.list.length);
	isVertexDrawn.fill(true);
}