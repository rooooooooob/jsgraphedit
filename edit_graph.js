"use strict";

function removeArc(G, u, v)
{
	var neighbors = G.list[u];
	const vindex = neighbors.indexOf(v);
	neighbors[vindex] = neighbors[neighbors.length - 1];
	neighbors.pop();
	G.matrix[u][v] = -1;
}

function createGraph(n)
{
	var G = {
		list : [],
		pos : [],
		matrix : []
	};
	
	for (var i = 0; i < n; ++i)
	{
		addVertex(G);
	}
	return G;
}

function removeEdge(G, u, v)
{
	removeArc(G, u, v);
	removeArc(G, v, u);
}

function removeVertex(G, id)
{
	const lastID = G.list.length - 1;
	G.list[id] = G.list[lastID];
	G.matrix[id] = G.matrix[lastID];
	G.pos[id] = G.pos[lastID];
	G.matrix.pop();
	G.list.pop();
	G.pos.pop();
	for (var i = 0; i < G.matrix.length; ++i)
	{
		G.matrix[i][id] = G.matrix[i][lastID];
		G.matrix[i].pop();
	}
	for (var vid = 0; vid < G.list.length; ++vid)
	{
		const neighbors = G.list[vid];
		for (var i = 0; i < neighbors.length; ++i)
		{
			if (neighbors[i] == id)
			{
				neighbors[i] = neighbors[neighbors.length - 1];
				neighbors.pop();
				--i;
			}
			else if (neighbors[i] == lastID)
			{
				neighbors[i] = id;
			}
		}
	}
	return lastID;
}

function setListFromMatrix(G)
{
	const n = G.matrix.length;
	for (var i = 0; i < n; ++i)
	{
		G.list[i] = [];
		for (var j = 0; j < n; ++j)
		{
			if (G.matrix[i][j] != -1)
			{
				G.list[i].push(j);
			}
		}
	}
}

function addEdge(G, u, v)
{
	addArc(G, u, v);
	addArc(G, v, u);
}

function addArc(G, u, v)
{
	if (G.matrix[u][v] == -1)
	{
		G.matrix[u][v] = 1;
		G.list[u].push(v);
	}
}

function hasEdge(G, u, v)
{
	return hasArc(G, u, v) || hasArc(G, v, u);
}

function hasArc(G, u, v)
{
	return G.matrix[u][v] == 1;
}

function addVertex(G, x, y)
{
	G.list.push([]);
	x = typeof x !== 'undefined' ? x : -1;
	y = typeof y !== 'undefined' ? y : -1;
	G.pos.push({x:x, y:y});
	G.matrix.push(new Array(G.list.length));
	G.matrix[G.list.length - 1].fill(-1);
	for (var i = 0; i < G.list.length - 1; ++i)
	{
		G.matrix[i].push(-1);
	}
	return G.list.length - 1;
}

function cloneGraph(G)
{
	var newVertices = new Array(G.list.length);
	var newPos = new Array(G.pos.length);
	for (var i = 0; i < G.list.length; ++i)
	{
		newVertices[i] = new Array(G.list[i].length);
		for (var j = 0; j < G.list[i].length; ++j)
		{
			newVertices[i][j] = G.list[i][j];
		}
		newPos[i] = {
			x : G.pos[i].x,
			y : G.pos[i].y
		};
	}
	var newMatrix = new Array(G.matrix.length);
	for (var i = 0; i < G.matrix.length; ++i)
	{
		newMatrix[i] = G.matrix[i].slice();
	}
	return {
		list : newVertices,
		matrix : newMatrix,
		pos : newPos
	};
}