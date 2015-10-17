function dfs(vertices, start)
{
	var order = [start];
	var visited = new Array(vertices.length);
	for (var i = 0; i < vertices.length; ++i)
	{
		visited[i] = false;
	}
	visited[start] = true;
	
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
	
	dfsInternal(vertices, start, order, visited);
	
	return order;
}