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
}

function addEdge(vertices, u, v)
{
	if (vertices[u].edges.indexOf(v) == -1)
	{
		vertices[u].edges.push(v);
	}
	if (!directed && vertices[v].edges.indexOf(u) == -1)
	{
		vertices[v].edges.push(u);
	}
}

function addVertex(vertices, x, y)
{
	vertices.push({x:x, y:y, edges:[]});
	return vertices.length - 1;
}