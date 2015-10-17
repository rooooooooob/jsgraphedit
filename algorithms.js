function dfs(vertices, start)
{
	var order = [start];
	var visited = new Array(vertices.length);
	for (var i = 0; i < vertices.length; ++i)
	{
		visited[i] = false;
	}
	visited[start] = true;
	
	dfsInternal(vertices, start, order, visited);
	
	return order;
}

function dfsInternal(vertices, u, order, visited)
{
	for (var i = 0; i < vertices[u].edges.length; ++i)
	{
		const v = vertices[u].edges[i];
		if (!visited[v])
		{
			visited[v] = true;
			order.push(v);
			dfsInternal(vertices, v, order, visited);
		}
	}
}

function isConnected(vertices)
{
	return dfs(vertices, 0).length == vertices.length;
}

function isCut(vertices, u)
{
	if (vertices[u].edges.length < 2)
	{
		return false;
	}
	var order = [u];
	var visited = new Array(vertices.length);
	for (var i = 0; i < vertices.length; ++i)
	{
		visited[i] = false;
	}
	visited[u] = true;
	
	// mark u as visited then start dfs at one of its neighbors
	// which will only visit the entire component if u was non-cut
	dfsInternal(vertices, vertices[u].edges[0], order, visited);
	
	return dfs(vertices, u).length != order.length;
}