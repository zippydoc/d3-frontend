import { Runtime, Inspector } from '@observablehq/runtime';
import React, { useEffect, useRef, useState } from 'react';
import nestedTreemap from './components/nested-treemap';
import zoomableSunburst from './components/zoomable-sunburst';
import tidyTree from './components/tidy-tree';
import './App.css';
import logo from './logo.png';
import { makeStyles, Box, CircularProgress, Link } from "@material-ui/core";

// const d3data = require('./flare.json');

const fetchData = async (key) => {
  try {
    const res = await fetch(`https://api.prod.zippydoc.net/api/core/admin/sql/cache/${key}`)

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

      if (!cacheKey) {
        setError(true)
        setErrMsg("couldn't find `key` parameter in query string")
        return
      }
      
      setLoading(true)
      const res = await fetchData(cacheKey)
      console.log('ComponentDidMount', res)
      // const res = {success: true, data: d3data}
      setLoading(false)

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
