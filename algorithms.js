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

function countEdges(vertices)
{
	var degsum = 0;
	for (var i = 0; i < vertices.length; ++i)
	{
		degsum += vertices[i].edges.length;
	}
	return degsum / 2;
}

function isTree(vertices)
{
	return isConnected(vertices) && vertices.length == countEdges(vertices) + 1;
}

function twopathDecompose(vertices)
{
	var paths = [];
	if (!isConnected(vertices))
	{
		// todo handle components separately if they're all even size?
		alert("only works on connected graphs");
		return paths;
	}
	
	// make a copy since this algorithm is destructive
	var g = vertices;//cloneGraph(vertices);
	
	// keep track of what vertex in g corresponds to what vertex in vertices
	// so we can return proper indices at the end
	var gtov = new Array(vertices.length);
	for (var i = 0; i < vertices.length; ++i)
	{
		gtov[i] = i;
	}
	
	while (countEdges(g) >= 2)
	{
		var u = -1;
		var v = -1
		var w = -1;
		
		// two cases - the graph is a tree
		if (isTreeIgnoreIsolatedVertices(g))//isTree(g))
		{
			//alert("tree");
			var found = false;
			for (var i = 0; !found && i < g.length; ++i)
			{
				// if it's a leaf and its stem also has a leaf, use that as the path
				// which you can prove that there is always at least 1 such vertex in a tree
				// unless possible the stem has only 1 other neighbor, in which
				// case we take the leaf -> stem -> stem's other neighbor path
				if (g[i].edges.length == 1)
				{
					const x = g[i].edges[0];
					if (g[x].edges.length == 2)
					{
						u = i;
						v = x;
						w = i == g[x].edges[1] ? g[x].edges[0] : g[x].edges[1];
						found = true;
					}
					for (var j = 0; !found && j < g[x].edges.length; ++j)
					{
						if (i != g[x].edges[j] && g[g[x].edges[j]].edges.length == 1)
						{
							u = i;
							v = x;
							w = g[x].edges[j];
							found = true;
						}
					}
				}
			}
			if (!found) alert("wut");
			//else alert("found");
		}
		// and the other - one there is a non-cut vertex with degree 2 or more
		else
		{
			//alert("not tree");
			for (var i = 0; i < g.length; ++i)
			{
				if (!isCut(g, i) && g[i].edges.length >= 2)
				{
					u = g[i].edges[0];
					v = i;
					w = g[i].edges[1];
					break;
				}
			}
		}
		
		if (u == -1 || v == -1 || w == -1) alert(":(");
		//else alert("removed " + gtov[u] + ", " + gtov[v] + ", " + gtov[w]);
		
		paths.push([[gtov[u], gtov[v]], [gtov[v], gtov[w]]]);
		
		removeEdge(g, u, v);
		removeEdge(g, v, w);
		// function removeIfIsolated(g, vertex)
		// {
			// if (g[vertex].edges.length == 0)
			// {
				// const newV = removeVertex(g, vertex);
				// gtov[newV] = vertex;
			// }
		// }
		// removeIfIsolated(g, u);
		// removeIfIsolated(g, v);
		// removeIfIsolated(g, w);
		
		redraw();
		
	}
	return paths;
}

function isTreeIgnoreIsolatedVertices(vertices)
{
	var isolated = 0;
	var lastCheckedComponentSize = 0;
	for (var i = 0; i < vertices.length; ++i)
	{
		if (vertices[i].edges.length == 0)
		{
			++isolated;
		}
	}
	for (var i = 0; i < vertices.length; ++i)
	{
		if (vertices[i].edges.length > 0)
		{
			lastCheckedComponentSize = dfs(vertices, i).length;
			break;
		}
	}
	return vertices.length - isolated == lastCheckedComponentSize  // connected (besides isolated)
	    && vertices.length - isolated == countEdges(vertices) + 1; // right amount of edges for a tree
}