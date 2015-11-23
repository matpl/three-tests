function drawArc(x, y, context, color)
{
    context.lineWidth = "1";
    context.beginPath();
    context.arc(x, y, 3, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
}

function ParametricLine(x0, y0, x1, y1)
{
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    
    this.y0my1 = this.y0 - this.y1;
    this.y1my0 = this.y1 - this.y0;
    this.x1mx0 = this.x1 - this.x0;
    this.x0y1 = this.x0 * this.y1;
    this.x1y0 = this.x1 * this.y0;
    this.norm = Math.sqrt(Math.pow(this.x1 - this.x0, 2) + Math.pow(this.y1 - this.y0, 2));
    this.normPow = Math.pow(this.x1 - this.x0, 2) + Math.pow(this.y1 - this.y0, 2);
    
    this.getClosestPoint = function(x, y, closestDistance)
    {        
        var dist = Math.abs((this.y0my1 * x + this.x1mx0 * y + (this.x0y1 - this.x1y0))) / this.norm;
        
        if(typeof closestDistance === 'undefined' || dist <= closestDistance)
        {
            // scalar projection:
            var scalar = (this.x1mx0 * (x - this.x0) + this.y1my0 * (y - this.y0)) / this.normPow;
        
            var newX = scalar * this.x1mx0 + this.x0;
            var newY = scalar * this.y1my0 + this.y0;
         
            return {x: newX, y: newY, distance: dist};
        }
        else
        {
            return null;
        }
    }
    
    this.getIntersection = function(parametricLine)
    {
        //http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
        var r = {x: this.x1 - this.x0, y: this.y1 - this.y0};
        var s = {x: parametricLine.x1 - parametricLine.x0, y: parametricLine.y1 - parametricLine.y0};
        var res = r.x * s.y - r.y * s.x;
        if(res == 0)
        {
            // lines are parallel
            return null;
        }
        else
        {
            var t = (parametricLine.x0 - this.x0) * s.y - (parametricLine.y0 - this.y0)  * s.x / res;
            //var u = (parametricLine.x0 - this.x0) * r.y - (parametricLine.y0 - this.y0)  * r.x / res;
            
            return {x: this.x0 + t*r.x, y: this.y0 + t*r.y};
        }
        
    }
    
    this.getDrawLinePoint = function(x2, y2, x3, y3, width, height)
    {
        var s = ((x3 - x2) * (y2 - this.y0) - (x2 - this.x0) * (y3 - y2)) / ((x3 - x2) * (this.y1 - this.y0) - (this.x1 - this.x0) * (y3 - y2));
        var t = ((this.x1 - this.x0) * (y2 - this.y0) - (x2 - this.x0) * (this.y1 - this.y0)) / ((x3 - x2) * (this.y1 - this.y0) - (this.x1 - this.x0) * (y3 - y2));
        
        if (isFinite(s) && isFinite(t))
        {
            var x = (x3 - x2) * t + x2;
            var y = (y3 - y2) * t + y2;
            //todowawa: for some reason i have to multiply by -1 in two cases... wtf is this
            //y = y * -1;
            if(x >= 0 && y >= 0 && x <= width && y <= height)
            {
                return {x: x, y: y};
            }
        }
        
        return null;
    }
    
    this.drawnLine = null;
    this.draw = function(context, width, height)
    {
		// for this we need the boundaries... top left corner is 0,0...
        if(this.drawnLine == null)
        {
            var bounds = [{x2: 0, y2: 0, x3: width, y3: 0}, {x2: 0, y2: 0, x3: 0, y3: height}, {x2: 0, y2: height, x3: width, y3: height}, {x2: width, y2: 0, x3: width, y3: height}];
            this.drawnLine = [];
            for(var i = 0; i < bounds.length; i+=2)
            {
                var pt = this.getDrawLinePoint(bounds[i].x2, bounds[i].y2, bounds[i].x3, bounds[i].y3, width, height);
                
                if(pt != null)
                {
                    if(this.drawnLine.length == 0)
                    {
                        this.drawnLine.push(pt);
                    }
                    else
                    {
                        if(this.drawnLine[0].x != pt.x || this.drawnLine[0].y != pt.y)
                        {
                            this.drawnLine.push(pt);
                        }
                    }
                    if(this.drawnLine.length == 2)
                        break;
                }
            }
        }
        if(this.drawnLine.length == 2)
        {
            context.save();
            context.lineWidth = "1";
            context.beginPath();
            context.moveTo(this.drawnLine[0].x, this.drawnLine[0].y);
            context.lineTo(this.drawnLine[1].x, this.drawnLine[1].y);
            context.strokeStyle = '#cecece';
            context.stroke();
            context.restore();   
        }
    }
}

function WallPoint(x, y)
{
    this.x = x;
    this.y = y;
}

function WallChain()
{
    this.handlers = [];
    this.points = [];
    this.parametricLines = [];
    
    this.addParametricLine = function(x0, y0, x1, y1)
    {
        var parametricLine = new ParametricLine(x0, y0, x1, y1);
        this.parametricLines.push(parametricLine);
        this.fire({type: 'add', object: parametricLine});
    }
    
    this.pointPushed = function()
    {
        if(this.points.length > 1)
        {
            //todowawa: NOT SURE FOR 45 DEGREES... show the guide lines and see if it's useful
            this.addParametricLine(this.points[this.points.length - 2].x, this.points[this.points.length - 2].y, this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
            
            // add two perpendicular parametric if the points are not
            if(this.points[this.points.length - 2].y != this.points[this.points.length - 1].y)
            {
                this.addParametricLine(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, this.points[this.points.length - 1].x + 1, this.points[this.points.length - 1].y);
            }
            if(this.points[this.points.length - 2].x != this.points[this.points.length - 1].x)
            {
                this.addParametricLine(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, this.points[this.points.length - 1].x, this.points[this.points.length - 1].y + 1);
            }
            if(this.points[this.points.length - 2].x - this.points[this.points.length - 1].x != this.points[this.points.length - 2].y - this.points[this.points.length - 1].y)
            {
                this.addParametricLine(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, this.points[this.points.length - 1].x + 1, this.points[this.points.length - 1].y + 1);
            }
            if(this.points[this.points.length - 2].x - this.points[this.points.length - 1].x != this.points[this.points.length - 1].y - this.points[this.points.length - 2].y)
            {
                this.addParametricLine(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, this.points[this.points.length - 1].x + 1, this.points[this.points.length - 1].y - 1);
            }
        }
        else if(this.points.length == 1)
        {
            this.addParametricLine(this.points[0].x, this.points[0].y, this.points[0].x + 1, this.points[0].y);
            this.addParametricLine(this.points[0].x, this.points[0].y, this.points[0].x, this.points[0].y + 1);
            
            this.addParametricLine(this.points[0].x, this.points[0].y, this.points[0].x + 1, this.points[0].y + 1);
            this.addParametricLine(this.points[0].x, this.points[0].y, this.points[0].x + 1, this.points[0].y - 1);
        }
    }
    
    // todowawa : also have a removed and a modified event or something
    this.addPoint = function(point)
    {
        this.points.push(point);
        this.pointPushed();
    }
    
    this.drawGuides = function(context, width, height)
    {
        for(var i = 0; i < this.parametricLines.length; i++)
        {
            this.parametricLines[i].draw(context, width, height);
        }
    }
    
	this.draw = function(context)
	{
		if(this.points.length  > 0)
        {
			drawArc(this.points[0].x,this.points[0].y * -1, context, 'blue');
			
            context.lineWidth = "1";
			context.beginPath();
			context.moveTo(this.points[0].x, this.points[0].y * -1);
			for(i = 1; i < this.points.length; i++)
			{
				context.lineTo(this.points[i].x, this.points[i].y * -1);
				context.strokeStyle = 'blue';
				context.stroke();
				
				if(i == this.points.length - 1)
				{
					// only if the last point is not the same as the first one
					if(this.points[i] != this.points[0])
					{
						drawArc(this.points[i].x, this.points[i].y * -1, context);   
					}
				}
			}
		}
	}
    
    this.getClosestPoint = function(x, y, closestDistance)
    {
        var closestPoint = null;
        for(var i = 0; i < this.parametricLines.length; i++)
        {
            var point = this.parametricLines[i].getClosestPoint(x, y, closestDistance);
            if(point != null && (closestPoint == null || point.distance < closestPoint.distance))
            {
                closestPoint = point;
            }
        }
        
        return closestPoint;
    }
}

var observerPrototype = {
 
    subscribe: function(fn, s) {
        this.handlers.push({func: fn, scope: s});
    },
 
    unsubscribe: function(fn) {
        this.handlers = this.handlers.filter(
            function(item) {
                if (item.func !== fn) {
                    return item;
                }
            }
        );
    },
 
    fire: function(o, thisObj) {
        var scope = thisObj || window;
        this.handlers.forEach(function(item) {
            item.func.call(item.scope, o);
        });
    }
};

WallChain.prototype = observerPrototype;

function FloorPlan()
{
    this.exteriorWallChain = new WallChain();
    this.wallChains = [];
    this.parametricIntersections = [];
    
    var fn = function(item)
    {
        if(item.type == 'add')
        {
            //todowawa: have a way to remove them if we remove the lines
            for(var i = 0; i < this.exteriorWallChain.parametricLines.length; i++)
            {
                //todowawa: if we already did a collinear line, simply skip it... we shouldnt add any collinear line in the first place
                var point = this.exteriorWallChain.parametricLines[i].getIntersection(item.object);
                if(point != null)
                {
                    this.parametricIntersections.push(point);
                }
            }
            
            for(var j = 0; j < this.wallChains.length; j++)
            {
                for(var i = 0; i < this.wallChains[j].parametricLines.length; i++)
                {
                    //todowawa: if we already did a collinear line, simply skip it... we shouldnt add any collinear line in the first place
                    var point = this.wallChains[j].parametricLines[i].getIntersection(item.object);
                    if(point != null)
                    {
                        this.parametricIntersections.push(point);
                    }
                }
            }
        }
    };
    
    this.exteriorWallChain.subscribe(fn, this);
    
    this.addWallChain = function(wallChain)
    {
        this.wallChains.push(wallChain);
        wallChain.subscribe(fn, this);
    }
    
    this.draw = function(context)
    {
        this.exteriorWallChain.draw(context);
		
		for(var i = 0; i < this.wallChains.length; i++)
		{
			//todowawa : draw walls here. Other  color perhaps?	
			this.wallChains[i].draw(context);
		}
    }
    
    this.drawGuides = function(context, width, height)
    {
        this.exteriorWallChain.drawGuides(context, width, height);
		
		for(var i = 0; i < this.wallChains.length; i++)
		{
			this.wallChains[i].drawGuides(context, width, height);
		}
    }
    
    this.getClosestPoint = function(x, y, closestDistance, snapToInter)
    {
        snapToInter = (typeof snapToInter === 'undefined') ? false : snapToInter;
        var closestPoint = this.exteriorWallChain.getClosestPoint(x, y, closestDistance);
        
        for(var i = 0; i < this.wallChains.length; i++)
        {
            var point = this.wallChains[i].getClosestPoint(x, y, closestDistance);
            
            if(point != null && (closestPoint == null || point.distance < closestPoint.distance))
            {
                closestPoint = point;
            }
        }
        
        if(snapToInter)
        {
            var closestInter = null;
            for(var i = 0; i < this.parametricIntersections.length; i++)
            {
                var dist = Math.sqrt(Math.pow(this.parametricIntersections[i].x - x,2) + Math.pow(this.parametricIntersections[i].y - y,2));
                if(dist <= closestDistance && (closestInter == null || dist < closestInter.distance))
                {
                    closestInter = {x: this.parametricIntersections[i].x, y: this.parametricIntersections[i].y, distance: dist};
                }
            }   
            
            if(closestInter != null)
            {
                closestPoint = closestInter;
            }
        }
        
        return closestPoint;
    }
}

function ThreePlan(floorPlan)
{
	this.floorPlan = floorPlan;
	
	this.draw = function()
	{
		//todowawa: create wall classes and stuff??? events on the floorplan maybe??
		var maxX = Number.MIN_VALUE;
		var maxY = Number.MIN_VALUE;
		var minX = Number.MAX_VALUE;
		var minY = Number.MAX_VALUE;
	
		for(var i = 0; i < this.floorPlan.exteriorWallChain.points.length - 1; i++)
		{
			maxX = Math.max(this.floorPlan.exteriorWallChain.points[i].x, maxX);
			maxY = Math.max(this.floorPlan.exteriorWallChain.points[i].y, maxY);
			
			minX = Math.min(this.floorPlan.exteriorWallChain.points[i].x, minX);
			minY = Math.min(this.floorPlan.exteriorWallChain.points[i].y, minY);
		}
		
		var offsetX = (minX + maxX) / 2;
		var offsetY = (minY + maxY) / 2;
	
		var totalX = 0;
		var totalY = 0;
		for(var i = 0; i < this.floorPlan.exteriorWallChain.points.length - 1; i++)
		{
			var material = new THREE.MeshLambertMaterial( {color: 0xc9c8c4, vertexColors: THREE.FaceColors} );
		
			if(i == 0)
			{
				totalX += this.floorPlan.exteriorWallChain.points[i].x;
				totalY += this.floorPlan.exteriorWallChain.points[i].y;
			}
			totalX += this.floorPlan.exteriorWallChain.points[i+1].x;
			totalY += this.floorPlan.exteriorWallChain.points[i+1].y;
			
			
			var a = this.floorPlan.exteriorWallChain.points[i+1].x - this.floorPlan.exteriorWallChain.points[i].x;
			var b = this.floorPlan.exteriorWallChain.points[i+1].y - this.floorPlan.exteriorWallChain.points[i].y;

			var distance = Math.sqrt(a*a + b*b);
			var angle = Math.atan2(a, b);
			
			var pivot1 = new THREE.Object3D();
			
			var geometry = new THREE.BoxGeometry( 2, 100, distance);
			
			mesh = new THREE.Mesh( geometry, material );
			
			mesh.position.x = 0;
			mesh.position.y = 0;
			
			// has to be half of the length
			mesh.position.z = 0 - distance / 2.0;
			
			pivot1.rotation.y = -angle;
			
			pivot1.position.x = this.floorPlan.exteriorWallChain.points[i].x - offsetX;
			pivot1.position.z = -(this.floorPlan.exteriorWallChain.points[i].y) + offsetY;
			
			pivot1.add(mesh);
			
			scene.add(pivot1);
			
			//todowawa: targetList and scene are in the other file
			targetList.push(mesh);
		}
		
		
		
		for(var j = 0; j < this.floorPlan.wallChains.length - 1; j++)
		{
			for(var i = 0; i < this.floorPlan.wallChains[j].points.length - 1; i++)
			{
				var material = new THREE.MeshLambertMaterial( {color: 0xc9c8c4, vertexColors: THREE.FaceColors} );
			
				var a = this.floorPlan.wallChains[j].points[i+1].x - this.floorPlan.wallChains[j].points[i].x;
				var b = this.floorPlan.wallChains[j].points[i+1].y - this.floorPlan.wallChains[j].points[i].y;

				var distance = Math.sqrt(a*a + b*b);
				var angle = Math.atan2(a, b);
				
				var pivot1 = new THREE.Object3D();
				
				var geometry = new THREE.BoxGeometry( 2, 100, distance);
				
				mesh = new THREE.Mesh( geometry, material );
				
				mesh.position.x = 0;
				mesh.position.y = 0;
				
				// has to be half of the length
				mesh.position.z = 0 - distance / 2.0;
				
				pivot1.rotation.y = -angle;
				
				pivot1.position.x = this.floorPlan.wallChains[j].points[i].x - offsetX;
				pivot1.position.z = -(this.floorPlan.wallChains[j].points[i].y) + offsetY;
				
				pivot1.add(mesh);
				
				scene.add(pivot1);
				
				//todowawa: targetList and scene are in the other file
				targetList.push(mesh);
			}
		}
		
		
		
		camera.position.x = totalX / this.floorPlan.exteriorWallChain.points.length;
		camera.position.z = -(totalY / this.floorPlan.exteriorWallChain.points.length);
		
		
		var material = new THREE.MeshLambertMaterial( {color: 0xe6e6e6} );
		material.side = THREE.DoubleSide;
		var rectShape = new THREE.Shape();
		for(var i = 0; i < this.floorPlan.exteriorWallChain.points.length; i++)
		{
			if(i == 0)
			{
				rectShape.moveTo( this.floorPlan.exteriorWallChain.points[i].x - offsetX, this.floorPlan.exteriorWallChain.points[i].y - offsetY);    
			}
			else
			{
				rectShape.lineTo( this.floorPlan.exteriorWallChain.points[i].x - offsetX,this.floorPlan.exteriorWallChain.points[i].y - offsetY);    
			}
		}

		var rectGeom = new THREE.ShapeGeometry( rectShape );
		var rectMesh = new THREE.Mesh( rectGeom, material ) ;
		rectMesh.rotation.x = -90 * Math.PI / 180;
		rectMesh.position.y = -50;
		scene.add( rectMesh );
	}
}

//todowawa: i don't think this is useful anymore since we have it on CTRL
function GuideLines(wallPoint)
{
    this.wallPoint = wallPoint;
    
    this.parametricLines = [];
    this.parametricLines.push(new ParametricLine(wallPoint.x, wallPoint.y, wallPoint.x + 1, wallPoint.y));
    this.parametricLines.push(new ParametricLine(wallPoint.x, wallPoint.y, wallPoint.x, wallPoint.y + 1));
    this.parametricLines.push(new ParametricLine(wallPoint.x, wallPoint.y, wallPoint.x + 1, wallPoint.y + 1));
    this.parametricLines.push(new ParametricLine(wallPoint.x, wallPoint.y, wallPoint.x + 1, wallPoint.y - 1));
    
    this.getClosestPoint = function(x, y)
    {
        var closestPoint = null;
        for(var i = 0; i < this.parametricLines.length; i++)
        {
            var point = this.parametricLines[i].getClosestPoint(x, y);
            if(i == 0 || point.distance < closestPoint.distance)
            {
                closestPoint = point;
            }
        }
        
        return closestPoint;
    }
}

var floorPlan = new FloorPlan();
var threePlan = new ThreePlan(floorPlan);