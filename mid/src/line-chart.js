export default class {
  constructor(c) {
    this.container = c;
    this.country = ' ';
    document.getElementById('country').innerText = this.country;
    this.svg = this.container.append("svg")
      .attr("width", this.width+this.margin.left+this.margin.right)
      .attr("height", this.height+this.margin.top+this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  get _container() { return this.container.node(); }
  get margin() { return {top: 10, right: 10, bottom: 30, left: 60}; }
  get width() { return this._container.offsetWidth-this.margin.left-this.margin.right; }
  get height() { return this._container.offsetHeight-this.margin.top-this.margin.bottom; }

  async loadCovid(file) {
    this.covid = await d3.json(file);
    d3.keys(this.covid).forEach(timestamp => {
      let classedData = { 'WD': [0, 0, 0, 0] };
      d3.keys(this.covid[timestamp]).forEach(continent => {
        classedData[continent] = [0, 0, 0, 0];
        d3.keys(this.covid[timestamp][continent]).forEach(country => {
          classedData[country] = [0, 0, 0, 0];
          for (let i = 0; i < 4; ++i) {
            classedData['WD'][i] = String(Number(classedData['WD'][i])+Number(this.covid[timestamp][continent][country][i]));
            classedData[continent][i] = String(Number(classedData[continent][i])+Number(this.covid[timestamp][continent][country][i]));
            classedData[country][i] = String(Number(classedData[country][i])+Number(this.covid[timestamp][continent][country][i]));
          }
        })
      })
      this.covid[timestamp].classedData = classedData;
    })
    this.months = new Set(d3.keys(this.covid).map(t => d3.timeFormat('%m')(t)));
  }
  
  scale(selection, option) {
    console.log(this.covid[d3.keys(this.covid)[0]].classedData[selection])
    console.log(this.covid[d3.keys(this.covid)[0]].classedData[selection][option])
    // scaling x axis
    this.xScale = d3.scaleTime()
      .domain(d3.extent(d3.keys(this.covid))) // [min date, max date]
      .range([0, this.width]);
    // scaling y axis
    this.yScale = d3.scaleLinear()
      .domain(d3.extent(d3.keys(this.covid), d => { 
        if ( selection in this.covid[d].classedData )
          return Number(this.covid[d].classedData[selection][option]); 
        return 0;
      })) // [min cases, max cases]
      .range([this.height, 0]);
  }

  changeCountry(country, name) {
    country = country.split('-')[1];
    console.log(country)
    if ( this.country == country ) {
      this.country = ' ';
      name = ' ';
    }
    else  this.country = country;

    document.getElementById('country').innerText = name;
    this.draw();
    this.update('');
  }

  update(cont) {
    d3.select('.vertline').remove();
    let time = document.getElementById('customRange1').value;
    console.log(time)
    this.svg.append("line")
      .attr("x1", this.xScale(time))  //<<== change your code here
      .attr("y1", 0)
      .attr("x2", this.xScale(time))  //<<== and here
      .attr("y2", this.height)
      .attr("class", "vertline")
      .style("stroke-width", 2)
      .style("stroke", "#1f447f")
      .style("fill", "none");
    const timestamp = d3.select('#customRange1').property("value");
    if ( this.country != ' ' ) {
      if ( this.country in this.covid[timestamp].classedData ) {
        document.getElementById('cases').innerText = this.covid[timestamp].classedData[this.country][1];
        document.getElementById('deaths').innerText = this.covid[timestamp].classedData[this.country][3];
      } else {
        document.getElementById('cases').innerText = 0;
        document.getElementById('deaths').innerText = 0;
      }
    } else if ( cont ) {
      if ( cont in this.covid[timestamp].classedData ) {
        document.getElementById('cases').innerText = this.covid[timestamp].classedData[cont][1];
        document.getElementById('deaths').innerText = this.covid[timestamp].classedData[cont][3];
      }
    } else {
      if ( 'WD' in this.covid[timestamp].classedData ) {
        document.getElementById('cases').innerText = this.covid[timestamp].classedData['WD'][1];
        document.getElementById('deaths').innerText = this.covid[timestamp].classedData['WD'][3];
      }
    }
  }
  // update(cont) {
  // }

  draw() {
    let selection = document.getElementById('select-cont').value;
    if ( this.country != ' ' ) selection = this.country;
    console.log(selection)
    d3.selectAll('.line').remove();
    d3.selectAll('.axis').remove();
    this.drawLine(selection)
    // call the x axis
    this.svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + 0 + "," + this.height + ")")
      .style("font-size", 18)
      .call(d3.axisBottom(this.xScale).ticks(this.months.size));
    // call the y axis
    this.svg.append("g")
      .attr("class", "axis")
      .style("font-size", 18)
      .call(d3.axisLeft(this.yScale).tickFormat(d => {
        if ( d >= 1e6 ) return d/1e6 + 'M';
        else if ( d >= 1e3 )  return d/1e3 + 'K';
        else  return d;
      }));
  }
  
  drawLine(selection) {
    const checkboxes = document.getElementsByName("checkbox");
    let option;
    if ( !checkboxes[0].checked && !checkboxes[1].checked ) return;
    // scaling data
    if ( checkboxes[0].checked ) {
      this.scale(selection, 1);
      option = 1;
    }
    else {
      this.scale(selection, 3);
      option = 3;
    }

    for (let i = 0; i < checkboxes.length; ++i) {
      if ( !checkboxes[i].checked ) continue;
      // build line generator
      let backup = this.yScale(0);
      this.lineGenerator = d3.line()
        .x(d => this.xScale(d))
        .y(d => {
          if ( selection in this.covid[d].classedData ) {
            backup = this.yScale(this.covid[d].classedData[selection][i*2+1]);
            return this.yScale(this.covid[d].classedData[selection][i*2+1]);
          }
          return backup;
          // console.log( Boolean( selection in this.covid[d].classedData ))
          // console.log(this.covid[d].classedData )
          // return this.yScale(0);
        })
        .curve(d3.curveMonotoneX);
      // draw line chart
      this.svg.append("path")
        .datum(d3.keys(this.covid).sort())
        .attr("class", "line")
        .attr("d", this.lineGenerator)
        .attr("stroke", (i == 0 ? "#DC143C" : "#121212"))
        .attr("stroke-width", 3)
        .attr("fill", "none");
    }

  }

  redraw() {
    // window.clearTimeout(this.redraw.timer);
    // this.redraw.timer = window.setTimeout(() => {
    //   this.svg
    //     .attr("width", this.width+this.margin.left+this.margin.right)
    //     .attr("height", this.height+this.margin.top+this.margin.bottom)
    //     .append("g")
    //     .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    //   this.draw();
    // }, 50);
  }
}