"use strict";

function dfs(G, start)
{
	var order = [start];
	var visited = new Array(G.list.length);
	for (var i = 0; i < G.list.length; ++i)
	{
		visited[i] = false;
	}
	visited[start] = true;
	
	dfsInternal(G, start, order, visited);
	
	return order;
}

function dfsInternal(G, u, order, visited)
{
	for (var i = 0; i < G.list[u].edges.length; ++i)
	{
		const v = G.list[u].edges[i];
		if (!visited[v])
		{
			visited[v] = true;
			order.push(v);
			dfsInternal(G, v, order, visited);
		}
	}
}

function isConnected(G)
{
	return dfs(G, 0).length == G.list.length;
}

function isCut(G, u)
{
	if (G.list[u].edges.length < 2)
	{
		return false;
	}
	var order = [u];
	var visited = new Array(G.list.length);
	for (var i = 0; i < G.list.length; ++i)
	{
		visited[i] = false;
	}
	visited[u] = true;
	
	// mark u as visited then start dfs at one of its neighbors
	// which will only visit the entire component if u was non-cut
	dfsInternal(G, G.list[u].edges[0], order, visited);
	
	return dfs(G, u).length != order.length;
}

function countEdges(G)
{
	var degsum = 0;
	for (var i = 0; i < G.list.length; ++i)
	{
		degsum += G.list[i].edges.length;
	}
	return degsum / 2;
}

function isTree(G)
{
	return isConnected(G) && G.list.length == countEdges(G) + 1;
}

function twopathDecompose(G)
{
	var paths = [];	
	// make a copy since this algorithm is destructive
	var H = cloneGraph(G);
	
	// keep track of what vertex in g corresponds to what vertex in vertices
	// so we can return proper indices at the end
	var gtov = new Array(H.list.length);
	for (var i = 0; i < H.list.length; ++i)
	{
		gtov[i] = i;
	}
	
	while (countEdges(H) >= 2)
	{
		var u = -1;
		var v = -1
		var w = -1;
		var found = false;
		// two cases -  one there is a non-cut vertex with degree 2 or more
		for (var i = 0; i < H.list.length; ++i)
		{
			if (!isCut(H, i))
			{
				if (H.list[i].edges.length >= 2)
				{
					u = H.list[i].edges[0];
					v = i;
					w = H.list[i].edges[1];
					found = true;
					break;
				}
			}
		}
		// and the other - all non-cut vertices have degree 1
		if (!found)
		{	
			// in any connected graph with at least 1 cut vertex there exists a cut vertex v
			// (and there must be a cut vertex since we know all non-cut vertices have a
			// degree of 1, yet such a graph can't be connected for n > 2)
			// such that all blocks in the graph containing that vertex are end-blocks
			// and end block -> exactly 1 cut vertex, which means that the only end-blocks
			// in our graph are star graphs, which we can simply choose any 2 leafs in the star
			// and use that - the only time this wouldn't work is when v is adjacent to only
			// 1 end-block. Now consider the non-end-block block that v is adjacent to.
			// v is adjacent to at least 2 vertices in this non-end block, and this non-end-block
			// is a non-separable subgraph, so if they are on a common cycle, so we can easily
			// remove the edge from v to one of them and use it.
			for (var i = 0; !found && i < H.list.length; ++i)
			{
				// so check for leaves - we know that a v is adjacent to a leaf if it's in
				// more than 2 components, so try them all
				if (H.list[i].edges.length == 1)
				{
					var x = H.list[i].edges[0];
					if (H.list[x].edges.length == 2)
					{
						u = i;
						v = x;
						w = i == H.list[x].edges[1] ? H.list[x].edges[0] : H.list[x].edges[1];
						found = true;
					}
					for (var j = 0; !found && j < H.list[x].edges.length; ++j)
					{
						if (i != H.list[x].edges[j] && H.list[H.list[x].edges[j]].edges.length == 1)
						{
							u = i;
							v = x;
							w = H.list[x].edges[j];
							found = true;
						}
					}
				}
			}
			// now we know that we must find a vertex adjacent to a leaf that we can remove 1
			// of its incident edges without alternting the number of components
			var isolated = 0;
			var componentSize = -1;
			for (var i = 0; i < H.list.length; ++i)
			{
				if (H.list[i].edges.length == 0)
				{
					++isolated;
				}
				else if (componentSize == -1)
				{
					componentSize = dfs(H, i).length;
				}
			}
			if (H.list.length != isolated + componentSize)
			{
				alert("H needs to be connected besides isolated vertices - something went wrong");
			}
			if (!found)
			{
				for (var i = 0; !found && i < H.list.length; ++i)
				{
					if (H.list[i].edges.length == 1)
					{
						x = H.list[i].edges[0];
						for (var j = 0; !found && j < H.list[x].edges.length; ++j)
						{
							const y = H.list[x].edges[j];
							if (i != y)
							{
								removeEdge(H, x, y);
								if (componentSize == dfs(H, x).length)
								{
									u = i;
									v = x;
									w = y;
									found = true;
								}
								addEdge(H, x, y);
							}
						}
					}
				}
			}
		}
		
		
		if (!found)
		{
			exportToList();
			alert(":(");
			return paths;
		}
		//else alert("removed " + gtov[u] + ", " + gtov[v] + ", " + gtov[w]);
		
		paths.push([[gtov[u], gtov[v]], [gtov[v], gtov[w]]]);
		
		removeEdge(H, u, v);
		removeEdge(H, v, w);
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

function isTreeIgnoreIsolatedVertices(G)
{
	var isolated = 0;
	var lastCheckedComponentSize = 0;
	for (var i = 0; i < G.list.length; ++i)
	{
		if (G.listG.list[i].edges.length == 0)
		{
			++isolated;
		}
	}
	for (var i = 0; i < G.list.length; ++i)
	{
		if (G.list[i].edges.length > 0)
		{
			lastCheckedComponentSize = dfs(G, i).length;
			break;
		}
	}
	return G.list.length - isolated == lastCheckedComponentSize  // connected (besides isolated)
	    && G.list.length - isolated == countEdges(G) + 1; // right amount of edges for a tree
}