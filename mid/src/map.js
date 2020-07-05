import tooltip from './tooltip.js'

const channels = {
  color: ["#fdbb30", "#ed8b00", "#f15d22", "#bf0d3e", "#910048"],
  texture: 123,
  oriented: 123
}

export default class {
  constructor(c) {
    this.container = c;
    this.zoom = d3.zoom()
      .scaleExtent([0.5, 9])
      .on("zoom", () => this.zoomed());
    this.svg = this.container.append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .call(this.zoom);
    this.g = this.svg.append("g");
    this.tags = this.svg.append("g");
    this.channels = {
      color: ["#fdbb30", "#ed8b00", "#f15d22", "#bf0d3e", "#910048"],
      texture: [1, 2, 3, 4, 5].map(n => {
        let t = textures.lines()
          .size(n * 5)
          .stroke('black')
          .strokeWidth(Math.pow(1.5, n));
        this.svg.call(t);
        return t.url();
      }),
      oriented: [0, 1, 2, 3, 4].map(n => {
        let t = textures.lines()
          .stroke('black')
          .orientation(`${n}/8`);
        this.svg.call(t);
        return t.url();
      })
    };
  }

  get _container() {
    return this.container.node();
  }

  get width() {
    return this._container.offsetWidth;
  }
  get height() {
    return this._container.offsetHeight;
  }

  get path() {
    const projection = d3.geoMercator()
      .translate( [this.width / 2, this.height / 2] )
      .scale( this.width / 2 / Math.PI );
    return d3.geoPath().projection(projection)
  }

  get handleMouseOver() {
    const self = this;
    return function () {
      const mouse = d3.mouse(self.svg.node()).map(d => parseInt(d));

      //offsets for tooltips on map
      const offsetL = self._container.offsetLeft + 20;
      const offsetT = self._container.offsetTop + 10;

      const posi = [mouse[0]+offsetL, mouse[1]+offsetT],
            text = this.__data__.properties.name;

      tooltip.show(posi, text);
    };
  }

  zoomed() {
    // const height = this.height,
    //       width = this.width;

    // const s = d3.event.transform.k,
    //       h = height / 4;

    // const t = [
    //   Math.min(
    //     (width / height)  * (s - 1),
    //     Math.max( width * (1 - s), d3.event.transform.x )
    //   ),
    //   Math.min(
    //     h*(s - 1) + h*s,
    //     Math.max( height*(1 - s) - h*s, d3.event.transform.y )
    //   )
    // ];

    //zoom.translateBy(t);
    // this.g.attr("transform", "translate(" + t + ")scale(" + s + ")");
    this.g.attr("transform", d3.event.transform);
    //adjust the country hover stroke width based on zoom level
    this.g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
  }

  async loadJSON(file) {
    this.world = await d3.json(file);
    this.topo = topojson.feature(this.world, this.world.objects.countries).features;
  }

  async loadCovid(file) {
    this.covid = await d3.json(file);
  }

  draw() {
    const path = this.path;

    this.g.append("path")
      .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
      .attr("class", "equator")
      .attr("d", path);
    
    const channel = d3.select("#select-channel").property("value");

    this.g.selectAll(".country").data(this.topo)
      .enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", d => `country-${d.id}`)
      .attr("title", d => d.properties.name)
      .style("stroke", "black")
      .on("mouseover", this.handleMouseOver)
      .on("mouseout", tooltip.hide);

    this.g.selectAll(".country").data(this.topo)
      .style("fill", this.channels[channel][0]);

    this.update();
  }

  redraw() {
    window.clearTimeout(this.redraw.timer);
    this.redraw.timer = window.setTimeout(() => {
      const path = this.path;
  
      this.svg.attr("width", this.width).attr("height", this.height);
  
      this.g.selectAll(".equator")
        .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
        .attr("d", path);
      this.g.selectAll(".country").data(this.topo)
        .attr("d", path)
    }, 50);
  }

  update() {
    const timestamp = d3.select('#customRange1').property("value"),
          channel = d3.select("#select-channel").property("value"),
          cont = d3.select("#select-cont").property("value");
    document.getElementById('date').innerText = d3.timeFormat('%Y/%m/%d')(timestamp);
  
    this.tags.selectAll("rect").data([4, 3, 2, 1, 0])
      .enter().append("rect")
      .attr("transform", (d, i) => `translate(${18}, ${this.height - (6 - i) * 20})`)
      .attr("width", 18)
      .attr("height", 18)
      .style("stroke", "black");
    
    this.tags.selectAll("rect").data([4, 3, 2, 1, 0])
      .style("fill", d => this.channels[channel][d]);
    
    if(cont != 'WD') {
      const data = this.covid[timestamp][cont];
      const countries = d3.keys(data);
      const q = d3.scaleQuantile()
        .domain(countries.map(cid => data[cid][1]))
        .range([0, 1, 2, 3, 4]);
      countries.map(cid => {
        d3.select(`#country-${cid}`)
          .style("fill", this.channels[channel][q(data[cid][1])]);
      });
    } else {
      const data = this.covid[timestamp];
      const conts = d3.keys(data);
      const q = d3.scaleQuantile()
        .domain([].concat.apply(...conts.map(cont => d3.keys(data[cont]).map(cid => data[cont][cid][1]))))
        .range([0, 1, 2, 3, 4]);
      conts.map(cont => d3.keys(data[cont]).map(cid => {
        d3.select(`#country-${cid}`)
          .style("fill", this.channels[channel][q(data[cont][cid][1])]);
      }))
    }
  }
}
