"use strict";

function removeArc(vertices, u, v)
{
	var neighbors = vertices[u].edges;
	const vindex = neighbors.indexOf(v);
	neighbors[vindex] = neighbors[neighbors.length - 1];
	neighbors.pop();
}

function removeEdge(vertices, u, v)
{
	removeArc(vertices, u, v);
	removeArc(vertices, v, u);
}

function removeVertex(vertices, id)
{
	const lastID = vertices.length - 1;
	for (var property in vertices[id])
	{
		vertices[id][property] = vertices[lastID][property];
	}
	vertices.pop();
	for (var vid = 0; vid < vertices.length; ++vid)
	{
		const neighbors = vertices[vid].edges;
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

function addEdge(vertices, u, v)
{
	addArc(vertices, u, v);
	addArc(vertices, v, u);
}

function addArc(vertices, u, v)
{
	if (vertices[u].edges.indexOf(v) == -1)
	{
		vertices[u].edges.push(v);
	}
}

function addVertex(vertices, x, y)
{
	vertices.push({x:x, y:y, edges:[]});
	return vertices.length - 1;
}

function cloneGraph(vertices)
{
	var newVertices = new Array(vertices.length);
	for (var i = 0; i < vertices.length; ++i)
	{
		newVertices[i] = {
			x : vertices[i].x,
			y : vertices[i].y,
			edges : new Array(vertices[i].edges.length)
		}
		for (var j = 0; j < vertices[i].edges.length; ++j)
		{
			newVertices[i].edges[j] = vertices[i].edges[j];
		}
	}
	return newVertices;
}