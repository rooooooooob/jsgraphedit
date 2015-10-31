"use strict";

function removeArc(G, u, v)
{
	var neighbors = G.list[u];
	const vindex = neighbors.indexOf(v);
	neighbors[vindex] = neighbors[neighbors.length - 1];
	neighbors.pop();
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
	for (var property in G.list[id])
	{
		G.list[id][property] = G.list[lastID][property];
	}
	G.list.pop();
	for (var vid = 0; vid < G.list.length; ++vid)
	{
		const neighbors = G.list[vid];
		for (var i = 0; i < neighbors.length; ++i)
		{
			if (neighbors[i] == id)
			{
				neighbors[i] = neighbors[neighbors.length - 1];
				neighbors.pop();
			}
			else if (neighbors[i] == lastID)
			{
				neighbors[i] = id;
			}
		}
	}
	return lastID;
}

function addEdge(G, u, v)
{
	addArc(G, u, v);
	addArc(G, v, u);
}

function addArc(G, u, v)
{
	if (G.list[u].indexOf(v) == -1)
	{
		G.list[u].push(v);
	}
}

function addVertex(G, x, y)
{
	G.list.push([]);
	G.pos.push({x:x, y:y});
	return G.list.length - 1;
}

function cloneGraph(G)
{
	var newVertices = new Array(G.list.length);
	for (var i = 0; i < G.list.length; ++i)
	{
		newVertices[i] = {
			x : G.list[i].x,
			y : G.list[i].y,
			edges : new Array(G.list[i].length)
		}
		for (var j = 0; j < G.list[i].length; ++j)
		{
			newVertices[i][j] = G.list[i][j];
		}
	}
	return {
		list : newVertices,
		matrix : [[]]
	};
}