/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
var radialTree = new RadialTree("./src/animal_intake_outtake.csv");
radialTree.generateTree();

/**
 * Updates tree with values changed through HTML 
 */
function update(){
    radialTree.setAttribute("enableTransitions", document.getElementById("transitions-enabled").checked);
    radialTree.setAttribute("branchColour", document.getElementById("branch-colour").value);
    radialTree.setAttribute("nodeColour", document.getElementById("node-colour").value);
    radialTree.setAttribute("nodeColourOnHover", document.getElementById("highlight-colour").value);
    radialTree.setAttribute("branchColourOnHover", document.getElementById("highlight-colour").value);
    radialTree.setAttribute("treeOpacityOnClick", document.getElementById("tree-opacity").value);
    radialTree.generateTree();
}