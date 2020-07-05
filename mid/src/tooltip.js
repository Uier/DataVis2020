const tooltip = d3.select("#tooltip");

tooltip.hide = function () {
  tooltip.classed("hidden", true);
}

tooltip.show = function (posi, text) {
  tooltip.classed("hidden", false)
    .attr("style", "left:"+(posi[0])+"px;top:"+(posi[1])+"px")
    .html(text);
}

export default tooltip;