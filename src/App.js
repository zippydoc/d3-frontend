import { Runtime, Inspector } from '@observablehq/runtime';
import React, { useEffect, useRef, useState } from 'react';
import nestedTreemap from './components/nested-treemap';
import zoomableSunburst from './components/zoomable-sunburst';
import tidyTree from './components/tidy-tree';
import collapsibleTree from './components/collapsible-tree';
import radialDendrogram from './components/radial-dendrogram';
import barChart from './components/bar-chart';
import stackedBarChart from './components/stacked-bar-chart';
import './App.css';
import logo from './logo.png';
import { makeStyles, Box, CircularProgress, Link } from "@material-ui/core";

// const d3data = require('./mock_data/flare.json');
// const d3data = require('./mock_data/bar_chart.json');
// const d3data = require('./mock_data/stacked_bar_chart.json');

const fetchData = async (key, env) => {
  try {
    let api_host;
    if (env === 'dev') {
      api_host = 'test.zippydoc.org'
    } else {
      api_host = 'api.prod.zippydoc.net'
    }

    const res = await fetch(`https://${api_host}/api/core/admin/sql/cache/${key}`)

    if (res.status >= 400) {
      console.error(res)
      throw new Error("Bad response from server")
    }
    const data = await res.json();
    return { 'success': true, 'data': data }
  } catch (err) {
    console.error(err)
    return { 'success': false, 'message': err.message }
  }
}

const App = props => {
  const ref = useRef()
  const [ loading, setLoading ] = useState(false)
  const [ error, setError ] = useState(false)
  const [ errMsg, setErrMsg ] = useState('')
  const [ chartType, setChartType ] = useState(null)

  const classes = useStyles();

  useEffect(() => {
    (async () => {
      const cacheKey = new URLSearchParams(window.location.search).get("key")
      const env = new URLSearchParams(window.location.search).get("env")

      if (!cacheKey) {
        setError(true)
        setErrMsg("couldn't find `key` parameter in query string")
        return
      }
      
      setLoading(true)
      const res = await fetchData(cacheKey, env)
      // const data = {
      //   'type': 'tidy_tree',
      //   'type': 'bar_chart',
      //   // 'type': 'stacked_bar_chart',
      //   'data': d3data
      // }
      // const res = {success: true, data: data}
      setLoading(false)

      if (res.data.type === 'bar_chart' || res.data.type === 'stacked_bar_chart') {
        if (res.data.data.length === 0) {
          setError(true)
          setErrMsg(`data is empty`)
          return
        }
      } else {
        if (res.data.data.children.length === 0) {
          setError(true)
          setErrMsg(`data is empty`)
          return
        }
      }

      let notebook;

      if (res.success) {
        switch (res.data.type) {
          case 'treemap':
            notebook = nestedTreemap
            break
          case 'zoomable_sunburst':
            notebook = zoomableSunburst
            break
          case 'tidy_tree':
            notebook = tidyTree
            break
          case 'collapsible_tree':
            notebook = collapsibleTree
            break
          case 'radial_dendrogram':
            notebook = radialDendrogram
            break
          case 'bar_chart':
            notebook = barChart
            break
          case 'stacked_bar_chart':
            notebook = stackedBarChart
            break
          default:
            setError(true)
            setErrMsg(`type parameter "${res.data.type}" is invalid`)
            return
        }
        
        setChartType(res.data.type)

        const runtime = new Runtime()
        
        runtime.module(notebook, (name) => {
          if (name === 'chart') {
            return new Inspector(ref.current)
          }
        }).variable().define("data", res.data.data);

        return () => runtime.dispose()
      } else {
        setError(true)
        setErrMsg(res.message)
      }
    })()
  }, [])

  let chartCls = '';
  if (chartType === 'zoomable_sunburst') {
    chartCls = classes.boxSunburst
  }

  return (
    <div className="App">
      <header>
        <a href="https://zippydoc.de/" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="logo" className="logo" />
        </a>
        <Link href="https://zippydoc.de/" className={classes.title} target="_blank">
          D3 Chart - powered by ZIPPYDOC
        </Link>
      </header>
      {loading &&
        <Box className={classes.loading}>
          <CircularProgress />
        </Box>
      }
      {error &&
        <div className="err">{errMsg}</div>
      }
      <div ref={ref} className={chartCls ? chartCls : ''} />
    </div>
  );
}

const useStyles = makeStyles((theme) => ({
  title: {
    width: '100%',
    textAlign: 'center',
    color: 'white'
  },
  loading: {
    width: '100%',
    textAlign: 'center',
    marginTop: 100
  },
  boxSunburst: {
    textAlign: 'center',
    maxWidth: 920,
    margin: "20px auto"
  }
}));

export default App;
