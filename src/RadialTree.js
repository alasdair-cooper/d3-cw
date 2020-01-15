/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// NOTES:
// d is the data element and is anonymous
// i is the index element
// function(d) passes the current data element as the parameter

/**
 * A class representing a d3 data visualization in the form of a "Radial Tidy Tree". In order to draw the tree, an instance of RadialTree
 * must be created (var x = new RadialTree([params])), then generateTree() must be run (x.generateTree()).
 */
class RadialTree{
    /**
     * Sets the tree's properties
     * 
     * @param {any} csvFile - the local path to the input CSV
     * @param {boolean} enableTransitions - enables transition making the node shapes, text and links to appear
     * @param {number} transitionMultiplier - changes the speed of the transition
     * @param {string} textSize - the size of the text
     * @param {number} textDistanceFromNode - the distance of the text from the node shape
     * @param {number} nodeOpacity - the node shape and text opacity
     * @param {string} nodeColour - the node shape and text colour
     * @param {string} nodeColourOnHover - the node shape and text colour on hover
     * @param {number} nodeRadius - the node radius
     * @param {number} branchOpacity - the branch opacity
     * @param {string} branchColour - the branch colour
     * @param {string} branchColourOnHover --the branch colour on hover
     * @param {number} branchThickness - the branch thickness
     * @param {number} treeOpacityOnClick - the rest of the tree opacity when a node shape or text is clicked 
     * @param {string} dataBoxID - the HTML ID of the place data should be placed
     * @param {number} rMultiplier - changes the distance between rings of nodes
     */
    constructor(
        csvFile, 

        enableTransitions = true,
        transitionMultiplier = 1,
        
        textSize = "4px",
        textDistanceFromNode = "0.3em",

        nodeOpacity = "1",
        nodeColour = "#173C82",
        nodeColourOnHover = "red",

        nodeRadius = "1.3px",

        branchOpacity = "0.5",
        branchColour = "#5F92F2",
        branchColourOnHover = "red",

        branchThickness = "1px",

        treeOpacityOnClick = "0.2",

        dataBoxID = "node-data",

        rMultiplier = 1
        ){
        this._csvFile = csvFile;

        this._enableTransitions = enableTransitions;
        this._transitionDurationMultiplier = 1 / transitionMultiplier;

        this._textSize = textSize;
        this._textDistanceFromNode = textDistanceFromNode;

        this._nodeOpacity = nodeOpacity;
        this._nodeColour = nodeColour;
        this._branchColourOnHover = branchColourOnHover;

        this._nodeRadius = nodeRadius;

        this._branchOpacity = branchOpacity,
        this._branchColour = branchColour;
        this._nodeColourOnHover = nodeColourOnHover;

        this._branchThickness = branchThickness;

        this._treeOpacityOnClick = treeOpacityOnClick;

        this._dataBoxID = dataBoxID;

        this._rMultiplier = rMultiplier;

        this._clicked = false;
        this._maxDepth = 0;
    }
    
    /**
     * Creates the tree's links, shapes and nodes and transitions them to visible
     * 
     */
    generateTree(){
        // creates a reference to the current RadialTree object as 'this' has a different value depending on context
        this._generated = false;
        var self = this;

        // clears the document of all current svg elements
        d3.selectAll("svg > *").remove();

        var svg = d3.select("svg");
        var width = +svg.attr("width");
        var height = +svg.attr("height");

        // creates a new group
        var g = svg.append("g").attr("transform", "translate(" + (width / 2 + 100) + "," + (height / 2 ) + ")");

        var stratify = d3.stratify()
        .parentId(function(d) { 
            //console.log(d.i);
            return d.id.substring(0, d.id.lastIndexOf(".")); 
        });

        // new tree layout with default settings
        var tree = d3.tree()
        .size([360, 500])
        // if they have the same parent then the separation is 1/a.depth, else 2/a.depth
        // never greater than 1
        .separation(function(a, b) { 
            return (a.parent == b.parent ? 1 : 2) / a.depth; 
        });

        //d3.csv turns a csv file into data elements, given that the csv contains hierarchical data
        d3.csv(this._csvFile).then(function(data){
            self._data = data;            

            var root = tree(stratify(data));
            self._root = root;
            
            // NOTE:
            // Both var link and var node edit all of the links and nodes at the same time, but they are changed differently due to their unique data

            var links = self.drawLinks(root, g);
            var nodes = self.drawNodes(root, g);

            var nodeShapes = nodes.selectAll("circle");
            var nodeText = nodes.selectAll("text");

            if(self._enableTransitions){
                if (self._generated == false){
                    self.drawTransitions(g);
                }
            }
            else{
                links.attr("stroke-dashoffset", 0);
                nodeText.attr("opacity", 1);
                nodeShapes.attr("r", self._nodeRadius);
                self._generated = true;
            }

            self._links = links;
            self._nodeShapes = nodeShapes;
            self._nodeText = nodeText;
        });
    }

    /**
     * Gets a property
     * 
     * @param {string} attribute - the property to fetch without the "_" (underscore)
     * @returns {any} - the value of the specified property
     */
    getAttribute(attribute){
        try{
            var i = Object.getOwnPropertyNames(this).indexOf("_" + attribute);

            if(i != -1){
                return this[Object.getOwnPropertyNames(this)[i]];
            }   
        } 
        catch(e){
            console.log(e.name + ' ' + e.message);
        }
    }
    
    /**
     * Sets a property
     * 
     * @param {string} attribute - the property to set without the "_" (underscore)
     * @param {string} value - the value to set the specified property to
     */
    setAttribute(attribute, value){
        try{
            var i = Object.getOwnPropertyNames(this).indexOf("_" + attribute);

            if(i != -1){
                this[Object.getOwnPropertyNames(this)[i]] = value;
            }   
        } 
        catch(e){
            console.log(e.name + ' ' + e.message);
        }
    }

    /**
     * Draws transitions for shapes, text and links to appear
     * 
     * @param {any} g - reference to the group within which the d3 elements are contained 
     */
    drawTransitions(g){
        var self = this;

        /**
         * 
         * @param {number} index - the max depth of nodes
         * @param {number} count - incremented counter 
         */
        function transitionChain(index, count = 0){
            if(index >= count & index != 0){
                setTimeout(() => {
                    transitionRing(self._nodeShapes, "s" + count);
                    transitionText(self._nodeText, "t" + count);
                    transitionBranch(self._links, "b" + (count - 1));
                    transitionChain(index, count + 1);
                }, 1500 * self._transitionDurationMultiplier);
            }
            else if(index > count & index == 0){
                setTimeout(() => {
                transitionRing(self._nodeShapes, "s0");
                transitionText(self._nodeText, "t0");
                }, 1500 * self._transitionDurationMultiplier);
            }
            if(index == count & count != 0){
                self._generated = true;
            }
        }

        transitionChain(self._maxDepth);

        /**
         * 
         * @param {any} branches - the group of elements to transition from
         * @param {string} cssSelector - the id of the group to transition
         */
        function transitionBranch(branches, cssSelector){
            branches = g.selectAll(".link[id^=" + cssSelector + "]");
            self.transitionGroup(branches, 2000, [["stroke-dashoffset", "0"]]);
        }

        /**
         * 
         * @param {any} ring - the group of elements to transition from
         * @param {string} cssSelector - the id of the group to transition
         */
        function transitionRing(ring, cssSelector){
            ring = g.selectAll("circle[id^=" + cssSelector + "]");
            self.transitionGroup(ring, 500, [["r", self._nodeRadius]]);
        }

        /**
         * 
         * @param {any} textBoxes - the group of elements to transition from
         * @param {string} cssSelector - the id of the group to transition
         */
        function transitionText(textBoxes, cssSelector){
            textBoxes = g.selectAll("text[id^=" + cssSelector + "]");
            self.transitionGroup(textBoxes, 500, [["opacity", "1"]]);
        }
    }
    
    /**
     * Draws links
     * 
     * @param {any} root - the root node 
     * @param {any} g - reference to the group within which the d3 elements are contained
     * @returns {any} - reference to a group of path elements
     */
    drawLinks(root, g){
        var self = this;
        var depths = [];
        var count = -1;

        var links = g.selectAll(".link")
            // specifies the data of the links
            .data(root.descendants().slice(1))
            .enter().append("path")
            .attr("class", "link")
            // adds an id based on the node depth in order to create transitions in rings
            .attr("id", function(d){
                if(depths.includes(d.depth)){
                    count = count + 1;
                    return "b" + depths.indexOf(d.depth) + "i" + parseInt(d.data.i);
                }
                else{
                    depths.push(d.depth); 
                }
                if(d.depth > self._maxDepth){
                    self._maxDepth = d.depth;
                }
                count = count + 1;
                return "b" + depths.indexOf(d.depth) + "i" + parseInt(d.data.i);
            })
            // draws cubic lines from the child to its parents
            .attr("d", function(d){
                // move to d.x, d.y
                var rMultiplier = 0.5;
                return "M" + self.project(d.x, d.y)
                // draw a curve using the start control point as d.x, (average(d.y, d.parent.y))
                    + "C" + self.project(d.x, (d.y + d.parent.y) / 2)
                // and the end control point as d.parent.x, (average(d.y, d.parent.y))
                    + " " + self.project(d.parent.x, (d.y + d.parent.y) / 2)
                // end at d.parent.x, d.parent.y
                    + " " + self.project(d.parent.x, d.parent.y); 
            })
            // changes the colour of each path
            .attr("stroke", self._branchColour)
            .attr("stroke-width", self._branchThickness)
            // hides the path until it is 'drawn' with a transition
            .each(function(d) { d.totalLength = this.getTotalLength(); })
                .attr("stroke-dasharray", function(d) {         
                        return d.totalLength + " " + d.totalLength; 
                    })
                .attr("stroke-dashoffset", function(d) {  
                        return -d.totalLength; 
                    })
                .attr("opacity", self._branchOpacity)
            .on("mouseover", function(d){self.routeToRoot(d);})
            .on("mouseout", function(d){self.routeToRoot(d);});
            
            

        return(links);
    }

    /**
     * Draws node shapes and text
     * 
     * @param {any} root - the root node 
     * @param {any} g - reference to the group within which the d3 elements are contained
     * @returns {any} - reference to a group of group elements
     */
    drawNodes(root, g){
        var self = this;

        var nodes = g.selectAll(".node")
            .data(root.descendants())
            // adds a group to each node in order to add text and shape decorations
            .enter().append("g")
            // adds a class to each node
            .attr("class", function(d) {
                // class is node--internal if the node has children
                // class is node--leaf if the node has no children 
                return "node" + (d.children ? " node--internal" : " node--leaf"); 
            })
            .attr("transform", function(d) { 
                // moves the element to a position
                return "translate(" + self.project(d.x, d.y) + ")"; 
            });

        self.drawNodeShape(nodes);
        self.drawNodeText(nodes, g);

        return nodes;
    }
    /**
     * Draws node shapes
     * 
     * @param {any} nodes - reference to a group of group elements that contain a circle and a text element
     */
    drawNodeShape(nodes){
        var self = this;
        var depths = [];
        var count = -1;

        // draws a circle
        nodes.append("circle")
            // radius is 0 originally (not visible)
            .attr("r", "0")
            .attr("opacity", 1)
            .style("fill", function(d){
                return (d.children ? self._nodeColour : self._nodeColour);
            })
            // adds an id based on the node depth in order to create transitions in rings
            .attr("id", function(d){
                if(depths.includes(d.depth)){
                    count = count + 1;
                    return "s" + depths.indexOf(d.depth) + "i" + d.data.i;
                }
                else{
                    depths.push(d.depth); 
                }
                count = count + 1;
                return "s" + depths.indexOf(d.depth) + "i" + d.data.i;
            })
            .on('mouseover', function(d){
                if(!d.children){
                    var returnString = self.processDataToReadable(d, "<br>");
                    self.changeTextByID(self._dataBoxID, returnString);
                }       
                self.routeToRoot(d);
            })
            .on("mouseout", function(d){self.routeToRoot(d);})
            .on("click", function(d){self.routeToRoot(d);})     
            .append("svg:title")
                .text(function(d) { 
                    if(!d.children){
                        var returnString = self.processDataToReadable(d, "\n");
                        return returnString;  
                    }
                });
    }

    /**
     * Draws node text
     * 
     * @param {any} nodes - reference to a group of group elements that contain a circle and a text element
     */
    drawNodeText(nodes){
        var self = this;
        var depths = [];
        var count = -1;

        nodes.append("text")
            // adds an id based on the node depth in order to create transitions in rings
            // text opacity is originally 0 (not visible)
            .attr("opacity", function(d) {if (self._generated == false){
                return 0;}})
            .attr("id", function(d){
                if(depths.includes(d.depth)){
                    count = count + 1;
                    return "t" + depths.indexOf(d.depth) + "i" + d.data.i;
                }
                else{
                    depths.push(d.depth); 
                }
                count = count + 1;
                return "t" + depths.indexOf(d.depth) + "i" + d.data.i;
            })
            // text distance from node
            .attr("dy", "0.32em")
            .attr("x", function(d) { 
                return d.x < 180 === !d.children ? 6 : -6; 
            })
            //spreads the leaf node text away from the center of the graph
            .style("text-anchor", function(d) { 
                return d.x < 180 === !d.children ? "start" : "end"; 
            })
            .style("font-size", self._textSize)
            .style("fill", function(d){
                return (d.children ? self._nodeColour : self._nodeColour);
            })
            // ensures the text is never upside down
            .attr("transform", function(d) { 
                return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; 
            })
            // gets the string after the last '.' in the csv entry
            .text(function(d) { 
                var string = "";
                d.children ? string = d.id.substring(d.id.lastIndexOf(".") + 1) : string = d.id.substring(d.id.lastIndexOf(".") + 1, d.id.lastIndexOf(":"));                
                return string.replace(/_/g, " ");
            })
            .on('mouseover', function(d){
                if(!d.children){
                    var returnString = self.processDataToReadable(d, "<br>");
                    self.changeTextByID(self._dataBoxID, returnString);
                }       
                self.routeToRoot(d);
            })
            .on("mouseout", function(d){self.routeToRoot(d);}) 
            .on("click", function(d){self.routeToRoot(d);})     
            .append("svg:title")
                .text(function(d) { 
                    if(!d.children){
                        var returnString = self.processDataToReadable(d, "\n");
                        return returnString;  
                    }
                });
    }

    /**
     * Computes the point on a circle
     * 
     * @param {number} x - angle in degrees
     * @param {number} y - distance between nodes
     * @returns {Array} - a calculation using x and y returning a coordinate point
     */
    project(x, y) {
        // calculates x - 90 in radians
        var angle = (x - 90) / 180 * Math.PI, radius = y * this._rMultiplier;
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
    }
    
    /**
     * Transitions a group of objects
     * 
     * @param {any} objects - the objects to transition
     * @param {number} duration - the time to transition over
     * @param {Array} attributes - the attributes to transition 
     */
    transitionGroup(objects, duration, attributes){
        duration = duration * this._transitionDurationMultiplier;
        attributes.forEach(element => {
            objects.transition().duration(duration).attr(element[0], element[1]);
        });
    }
    
    /**
     * Changes an HTML element's text by its ID
     * 
     * @param {string} id - the id of the element to change
     * @param {string} text - the text to add to the element
     */
    changeTextByID(id, text){
        var element = document.getElementById(id);
        element.innerHTML = text;
    }

    /**
     * Turns the data stored in the id column for a specific object into readable data with a label for each value
     * 
     * @param {any} d - the data element
     * @param {string} newlineChar - the newline character to delimit the text by, usually <br> for html or \n for other text
     * @returns {string} - the formed string with the data matched with headings
     */
    processDataToReadable(d, newlineChar){
        var string =  d.id.substring(d.id.lastIndexOf(":") + 1);
        var stringArray = string.split("\\");
        var headerArray = ["Name","Type","Breed","Color","Sex","Size","Date Of Birth","Impound Number","Kennel Number","Animal ID","Intake Date","Outcome Date","Days in Shelter","Intake Type","Intake Subtype","Outcome Type","Outcome Subtype","Intake Condition","Outcome Condition","Intake Jurisdiction","Outcome Jurisdiction","Outcome Zip Code"];
        var returnString = "";
        for (let i = 0; i < headerArray.length; i++) {
            returnString = returnString + headerArray[i] + " : " + stringArray[i] + newlineChar;
        }
        returnString = returnString.replace(/_/g, " ");

        return returnString;
    }

    /**
     * Highlights the route to the root, or changes the tree's opacity depending on the event (mouseover, mouseout, click)
     * 
     * @param {any} d - the data element
     */
    routeToRoot(d){
        var self = this;
        if(self._generated == true){

            // set colours
            var branchColour = self._branchColour;
            var nodeColour = self._nodeColour;

            // set opacities
            var branchOpacity = self._branchOpacity;
            var nodeOpacity = self._nodeOpacity;

            switch (d3.event.type) {
                case "mouseover":
                    branchColour = self._branchColourOnHover;
                    nodeColour = self._nodeColourOnHover;
                    branchOpacity = 1;
                    nodeOpacity = 1;
                    
                    break;
                    
                case "mouseout":
                    branchColour = self._branchColour;
                    nodeColour = self._nodeColour;
                    if(self._clicked){
                        branchOpacity = self._treeOpacityOnClick;
                        nodeOpacity = self._treeOpacityOnClick;
                    }
                    else{
                        branchOpacity = self._branchOpacity;
                        nodeOpacity = self._nodeOpacity;
                    }
                    break;
                case "click":
                    if(self._clicked){
                        self._links.attr("opacity", self._branchOpacity);
                        self._nodeText.attr("opacity", self._nodeOpacity);
                        self._nodeShapes.attr("opacity", self._nodeOpacity);
                        branchOpacity = self._branchOpacity;
                        nodeOpacity = self._nodeOpacity;
                    }
                    else{
                        self._links.attr("opacity", self._treeOpacityOnClick);
                        self._nodeShapes.attr("opacity", self._treeOpacityOnClick);
                        self._nodeText.attr("opacity", self._treeOpacityOnClick);
                    }
                    nodeColour = self._nodeColourOnHover;
                    branchColour = self._branchColourOnHover;
                    self._clicked = !self._clicked;
                    break;
                default:
                    break;
            }
            
            var x = d;
            for(var f = 0; f <= d.depth; f++) {
                d3.select("#b" + (x.depth - 1) + "i" + parseInt(x.data.i)).attr('stroke', branchColour).attr("opacity", branchOpacity);
                d3.select("#s" + (x.depth) + "i" + parseInt(x.data.i)).attr("opacity", nodeOpacity).style('fill', nodeColour);
                d3.select("#t" + (x.depth) + "i" + parseInt(x.data.i)).attr("opacity", nodeOpacity).style('fill', nodeColour);
                x = x.parent;
            }
        }
    }
}