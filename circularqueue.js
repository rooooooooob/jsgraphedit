var CircularQueue = function(n)
{
	this.buffer = new Array(n);
	this.nextIndex = 0;
	this.front = 0;
}

CircularQueue.prototype.push = function(e)
{
	if (this.length() == this.buffer.length)
	{
		alert("implement expansion later");
	}
	this.buffer[this.nextIndex++] = e;
}

CircularQueue.prototype.pop = function()
{
	const ret = this.buffer[this.front];
	this.buffer[this.front] = null;
	this.front = (this.front + 1) % this.buffer.length;
	return ret;
}

CircularQueue.prototype.length = function()
{
	return (this.nextIndex + this.buffer.length - this.front) % this.buffer.length;
}

CircularQueue.prototype.toString = function()
{
	var ret = "[";
	const n = this.length();
	for (var i = 0; i < n; ++i)
	{
		if (i != 0)
		{
			ret += ", ";
		}
		ret += this.buffer[(this.front + i) % this.buffer.length];
	}
	return ret + "]";
}