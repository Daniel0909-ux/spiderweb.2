import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { linkPositionFromEdges, getNodeGroups } from "./drawHelpers";
import { renderCoreDevices } from "./renderCoreDevices";
import {
  setupInteractions,
  drawAllParallelLinks,
  removeAllParallelLinks,
} from "./handleInteractions";

const NetworkVisualizer5 = ({
  theme,
  data,
  onZoneClick,
  onLinkClick,
  onNodeClick,
}) => {
  const svgRef = useRef();

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const width = svgElement.clientWidth || window.innerWidth;
    const height = svgElement.clientHeight || window.innerHeight;

    // --- MODIFIED: Use the data from props instead of constants ---
    const nodes = structuredClone(data.nodes || []);
    const links = structuredClone(data.links || []);

    // Guard against running with no data, which could cause errors
    if (nodes.length === 0) {
      d3.select(svgElement).selectAll("*").remove(); // Clear SVG if no data
      return;
    }

    const NODE_GROUPS = getNodeGroups(nodes);

    const nodeMap = {};
    NODE_GROUPS.forEach((zone) => {
      const zoneNodes = nodes.filter((n) => n.zone === zone.id);
      const baseAngle = zone.angle;
      const perp = baseAngle + Math.PI / 2;
      const spacing = 140;
      zoneNodes.forEach((n, i) => {
        const offset = (i - (zoneNodes.length - 1) / 2) * spacing;
        n.x = zone.cx + offset * Math.cos(perp);
        n.y = zone.cy + offset * Math.sin(perp);
        nodeMap[n.id] = n;
      });
    });
    links.forEach((l) => {
      l.source = nodeMap[l.source];
      l.target = nodeMap[l.target];
    });

    const isDark = theme === "dark";

    const palette = {
      bg: isDark ? "#1f2937" : "#ffffff",
      link: isDark ? "#94a3b8" : "#6b7280",
      node: isDark ? "#29c6e0" : "#29c6e0",
      nodeHoverDirect: isDark ? "#1d9bb4" : "#22b8d4",
      stroke: isDark ? "#60a5fa" : "#1d4ed8",
      label: isDark ? "#ffffff" : "#1f2937",
      zone: {
        fill: isDark ? "#38bdf8" : "#7dd3fc",
        opacity: isDark ? 0.12 : 0.25,
        hoverFill: isDark ? "#7dd3fc" : "#bae6fd",
        hoverOpacity: isDark ? 0.25 : 0.4,
      },
      nodeHoverLink: isDark ? "#fde68a" : "#fef08a",
      nodeHoverLinkStroke: isDark ? "#facc15" : "#f59e0b",

      status: {
        up: isDark ? "#4ade80" : "#22c55e", // Tailwind green-400 / green-500
        down: isDark ? "#f87171" : "#ef4444", // Tailwind red-400 / red-500
        issue: isDark ? "#facc15" : "#f59e0b", // Tailwind yellow-400 / amber-500
      },
    };

    const svg = d3
      .select(svgElement)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", palette.bg);

    svg.selectAll("*").remove();
    // const tooltipLayer = svg.append("g"); // MOVED
    const zoomLayer = svg.append("g").attr("class", "main-zoom-layer");
    const tooltipLayer = svg.append("g").attr("class", "tooltip-layer-group"); // APPENDED AFTER zoomLayer

    const ZOOM_THRESHOLD = 1.5; // The scale at which detailed links appear
    let parallelLinksAreVisible = false; // State tracker

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.05, 8])
      .on("zoom", (event) => {
        const { transform } = event;
        zoomLayer.attr("transform", transform);

        // Check if we need to change the link display state
        if (transform.k >= ZOOM_THRESHOLD && !parallelLinksAreVisible) {
          // --- ZOOMING IN past the threshold ---
          parallelLinksAreVisible = true;
          // Hide the summary links
          link.style("display", "none");
          linkHover.style("display", "none");
          // Draw all detailed links
          drawAllParallelLinks({
            zoomLayer,
            allNodes: node.data(),
            filteredLinks,
            tooltip,
            palette,
            onLinkClick,
            linkSelection: link,
          });
        } else if (transform.k < ZOOM_THRESHOLD && parallelLinksAreVisible) {
          // --- ZOOMING OUT past the threshold ---
          parallelLinksAreVisible = false;
          // Remove all detailed links
          removeAllParallelLinks(zoomLayer);
          // Show the summary links again
          link.style("display", null); // 'null' removes the inline style
          linkHover.style("display", null);
        }
      });

    svg.call(zoomBehavior);

    const { link, linkHover, node, label, filteredLinks } = renderCoreDevices(
      zoomLayer,
      nodes,
      links,
      // ... same arguments
      NODE_GROUPS,
      palette,
      onZoneClick,
      onNodeClick
    );

    link.attr("stroke", palette.link);
    node.attr("fill", palette.node).attr("stroke", palette.stroke);
    label.attr("fill", palette.label);

    const tooltip = tooltipLayer // Tooltip text is added to tooltipLayer
      .append("text")
      .attr("class", "svg-tooltip")
      .attr("x", 0) // Positioned relative to screen/SVG, not zoomLayer
      .attr("y", 0)
      .attr("text-anchor", "start")
      .attr("font-size", 14)
      .attr("fill", palette.label)
      .attr("opacity", 0)
      .style("pointer-events", "none")
      .style("user-select", "none");

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    link
      .attr("x1", (d) => linkPositionFromEdges(d).x1)
      .attr("y1", (d) => linkPositionFromEdges(d).y1)
      .attr("x2", (d) => linkPositionFromEdges(d).x2)
      .attr("y2", (d) => linkPositionFromEdges(d).y2);
    linkHover
      .attr("x1", (d) => linkPositionFromEdges(d).x1)
      .attr("y1", (d) => linkPositionFromEdges(d).y1)
      .attr("x2", (d) => linkPositionFromEdges(d).x2)
      .attr("y2", (d) => linkPositionFromEdges(d).y2);

    // --- Calculate and Apply Initial Transform to Center Content ---
    if (nodes.length > 0) {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      nodes.forEach((n) => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      });

      const dataWidth = maxX - minX;
      const dataHeight = maxY - minY;
      const dataCenterX = minX + dataWidth / 2;
      const dataCenterY = minY + dataHeight / 2;

      // --- ADJUSTMENTS FOR ZOOM AND POSITION ---
      const zoomOutFactor = 0.9; // e.g., 0.7 means zoom out to 70% of the auto-fit scale
      const verticalScreenOffset = 9; // e.g., 50 pixels down from the center

      // Padding: adjust as needed, or make it dependent on the zoomOutFactor
      const paddingFactor = 0.15; // e.g. 15% padding
      const padding = Math.min(width, height) * paddingFactor;
      const viewWidth = width - 2 * padding;
      const viewHeight = height - 2 * padding;

      let k = 1;

      if (dataWidth > 0 && dataHeight > 0) {
        k = Math.min(viewWidth / dataWidth, viewHeight / dataHeight);
      } else if (dataWidth > 0) {
        k = viewWidth / dataWidth;
      } else if (dataHeight > 0) {
        k = viewHeight / dataHeight;
      }

      // Apply the zoom out factor
      k *= zoomOutFactor;

      const [minScale, maxScale] = zoomBehavior.scaleExtent();
      k = Math.max(minScale, Math.min(maxScale, k));

      // Calculate translation to center the content
      let tx = width / 2 - dataCenterX * k;
      let ty = height / 2 - dataCenterY * k;

      // Apply the vertical offset (shifts the content down on the screen)
      ty += verticalScreenOffset;

      const initialTransform = d3.zoomIdentity.translate(tx, ty).scale(k);
      svg.call(zoomBehavior.transform, initialTransform);

      // NEW: Check initial state after transform is applied
      if (k >= ZOOM_THRESHOLD) {
        // If we start zoomed in, trigger the logic immediately
        const event = { transform: initialTransform };
        zoomBehavior.on("zoom")(event); // Manually fire the zoom handler
      }
    } else {
      svg.call(zoomBehavior.transform, d3.zoomIdentity);
    }
    // --- End Initial Transform ---

    requestAnimationFrame(() =>
      setupInteractions({
        link,
        linkHover,
        filteredLinks,
        node,
        tooltip,
        palette,
        zoomLayer,
        onLinkClick,
      })
    );
  }, [onZoneClick, data, theme, onLinkClick, onNodeClick]);

  return (
    <svg
      ref={svgRef}
      className="absolute top-0 left-0 w-full h-full bg-white dark:bg-gray-800"
    />
  );
};

export default NetworkVisualizer5;
