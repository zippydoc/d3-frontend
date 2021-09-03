import { Runtime, Inspector } from '@observablehq/runtime';
import React, { useEffect, useRef, useState } from 'react';
import zoomable_sunburst from './components/zoomable-sunburst';
import nested_treemap from './components/nested-treemap';
import './App.css';
import logo from './logo.png';
import { makeStyles, Box, CircularProgress } from "@material-ui/core";

const d3data = require('./flare.json');

// const fetchData = async (key) => {
//   try {
//     const res = await fetch(`https://test.zippydoc.org/api/core/admin/sql/cache/${key}`)

//     if (res.status >= 400) {
//       console.error(res)
//       throw new Error("Bad response from server")
//     }
//     return { 'success': true, 'data': res.json() }
//   } catch (err) {
//     console.error(err)
//     return { 'success': false, 'message': err.message }
//   }
// }

const App = props => {
  const ref = useRef()
  const [ loading, setLoading ] = useState(false)
  const [ error, setError ] = useState(false)
  const [ errMsg, setErrMsg ] = useState('')
  const [ key, setKey ] = useState(null)

  const classes = useStyles();

  useEffect(() => {
    (async () => {
      console.log('Mounting App')
      
      setLoading(true)
      // const res = await fetchData('123')
      const res = {success: true, data: d3data}
      setLoading(false)

      let notebook;

      if (res.success) {
        const cacheKey = new URLSearchParams(window.location.search).get("key")
        if (cacheKey === '1') {
          notebook = nested_treemap
        } else if (cacheKey === '2') {
          notebook = zoomable_sunburst
        } else {
          notebook = zoomable_sunburst
        }
        setKey(cacheKey)

        const runtime = new Runtime()
        
        runtime.module(notebook, (name) => {
          if (name === 'chart') {
            return new Inspector(ref.current)
          }
        }).variable().define("data", res.data);

        return () => runtime.dispose()
      } else {
        setError(true)
        setErrMsg(res.message)
      }
    })()
  }, [])

  useEffect(() => {
    console.log('Rendering App')
  })

  let chartCls = '';
  if (key === '2') {
    chartCls = classes.boxSunburst
  }

  return (
    <div className="App">
      <header>
        <a href="https://zippydoc.de/" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="logo" className="logo" />
        </a>
        <Box className={classes.title}>ZippyDoc Chart</Box>
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
