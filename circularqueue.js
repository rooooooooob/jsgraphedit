var CircularQueue = function(n)
{
	this.buffer = new Array(n);
	this.back = -1;
	this.front = -1;
};

CircularQueue.prototype.push = function(e)
{
	const n = this.length();
	if (n == this.buffer.length)
	{
		var newBuffer = new Array(this.buffer.length * 2);
		for (var i = 0; i < n; ++i)
		{
			newBuffer[i] = this.get(i);
		}
		this.front = 0;
		this.back = n - 1;
		this.buffer = newBuffer;
	}
	else if (n == 0)
	{
		this.front = 0;
	}
	this.buffer[++this.back] = e;
};

CircularQueue.prototype.pop = function()
{
	const ret = this.buffer[this.front];
	this.buffer[this.front] = null;
	this.front = (this.front + 1) % this.buffer.length;
	if (this.length() == 0)
	{
		this.back = 0;
		this.front = -1;
	}
	return ret;
};

CircularQueue.prototype.length = function()
{
	if (this.front == -1)
	{
		return 0;
	}
	return ((this.back + this.buffer.length - this.front) % this.buffer.length) + 1;
};

CircularQueue.prototype.get = function(i)
{
	return this.buffer[(((this.front + i) % this.buffer.length) + this.buffer.length) % this.buffer.length];
};

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
		ret += this.get(i);
	}
	return ret + "]";
};