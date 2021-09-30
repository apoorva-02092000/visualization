import './App.css';
import * as d3 from 'd3'
import {useEffect, useState, useReducer} from 'react'
import * as XLSX from 'xlsx';
import { Doughnut } from 'react-chartjs-2';



function App() {
   
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
 
  // process CSV data
  const processData = dataString => {
    const dataStringLines = dataString.split(/\r\n|\n/);
    const headers = dataStringLines[0].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
 
    const list = [];
    for (let i = 1; i < dataStringLines.length; i++) {
      const row = dataStringLines[i].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
      if (headers && row.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            if (d[0] === '"')
              d = d.substring(1, d.length - 1);
            if (d[d.length - 1] === '"')
              d = d.substring(d.length - 2, 1);
          }
          if (headers[j]) {
            obj[headers[j]] = d;
          }
        }
 
        // remove the blank rows
        if (Object.values(obj).filter(x => x).length > 0) {
          list.push(obj);
        }
      }
    }
 
    // prepare columns list from headers
    const columns = headers.map(c => ({
      name: c,
      selector: c,
    }));
 
    setData(list);
    setColumns(columns);
    return list;
  }
 
  // handle file upload
  const handleFileUpload = e => {
    
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      /* Parse data */
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_csv(ws, { header: 1 });
      let a = processData(data);
      
      generate(a)
    };

    reader.readAsBinaryString(file);
    
  }
 
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);


  function generate(a){
    let data = []
    for (var key of Object.keys(a[0])) {
      let set = {subject: key, count: a[0][key]}
      data.push(set)
  }
      // Generate a p tag for each element in the data with the text: Subject: Count 
      d3.select('#pgraphs').selectAll('p').data(data).enter().append('p').text(dt => dt.subject + ": " + dt.count)
      // Bar Chart:
        const getMax = () => { // Calculate the maximum value in the data
          let max = 0
          data.forEach((dt) => {
              if(dt.count > max) {max = dt.count}
          })
          return max
        }
     
        
        // Create each of the bars and then set them all to have the same height(Which is the max value)
        d3.select('#BarChart').selectAll('div').data(data) 
        .enter().append('div').classed('bar', true).style('height', `${getMax()}px`)
    
        //Transition the bars into having a height based on their corresponding count value
        d3.select('#BarChart').selectAll('.bar')
        .transition().duration(1000).style('height', bar => `${bar.count}px`)
          .style('width', '80px').style('margin-right', '10px').delay(300) // Fix their width and margin
        
        
         // Generate random data for our line where x is [0,15) and y is between 0 and 100
         let lineData = []
         for(let i = 0; i < 15; i++) {
            lineData.push({x: i + 1, y: Math.round(Math.random() * 100)})
         }
    
         // Create our scales to map our data values(domain) to coordinate values(range)
         let xScale = d3.scaleLinear().domain([0,15]).range([0, 300])
         let yScale = d3.scaleLinear().domain([0,100]).range([300, 0]) // Since the SVG y starts at the top, we are inverting the 0 and 300.
         
         // Generate a path with D3 based on the scaled data values
         let line = d3.line()
          .x(dt => xScale(dt.x))
          .y(dt => yScale(dt.y))
         
         // Generate the x and y Axis based on these scales
         let xAxis = d3.axisBottom(xScale)
         let yAxis = d3.axisLeft(yScale)
         
         // Create the horizontal base line
         d3.select('#LineChart').selectAll('path').datum(lineData) // Bind our data to the path element
        .attr('d', d3.line().x(dt => xScale(dt.x)) // Set the path to our line function, but where x is the corresponding x
        .y(yScale(0))).attr("stroke", "blue").attr('fill', 'none') // Set the y to always be 0 and set stroke and fill color
    
    
        
         d3.select('#LineChart').selectAll('path').transition().duration(1000) // Transition the line over 1 sec
         .attr('d', line) // Set the path to our line variable (Which corresponds the actual path of the data)
         
         // Append the Axis to our LineChart svg
         d3.select('#LineChart').append("g")
         .attr("transform", "translate(0, " + 300 + ")").call(xAxis)
    
         d3.select('#LineChart').append("g")
         .attr("transform", "translate(0, 0)").call(yAxis)
    }

  return (
    <div className = "App">
      <div id="pgraphs"></div> 
      <div id="BarChart"></div> 
      <svg id="LineChart" width = {350} height = {350}><path/></svg> 

      <h3>Read CSV file in React - <a href="https://www.cluemediator.com" target="_blank" rel="noopener noreferrer">Clue Mediator</a></h3>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
      />
      <button onClick={forceUpdate}>Force update</button>
      <Doughnut data={data}/>
    </div>
  );
}

export default App;