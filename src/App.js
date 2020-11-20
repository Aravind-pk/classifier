import React , {useReducer, useState ,useRef}  from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import './App.css';
import { Identity } from '@tensorflow/tfjs';

const stateMachine = {
  initial: 'initial' , 
  states : {
    initial :{ on :{ next : "loadingModel"}},
    loadingModel :{ on :{ next : "awaitingUpload"}},
    awaitingUpload :{ on :{ next : "ready"}},
    ready :{ on :{ next : "classiffing"} , showImage:true },
    classiffing :{ on :{ next : "complete"}},
    complete :{ on :{ next : "awaitingUpload"} , showImage:true , showResult:true}   
  }
}

const reducer = (currentState , event ) => stateMachine.states[currentState].on[event]  || stateMachine.initial ;

const formatResults = ({className , probability}) => {
  console.log('log started');
  return(
  <li key = {className}>
    {`${className} : ${(probability * 100).toFixed(2)}%`}
  </li>
  )
}

function App() {  
  tf.setBackend("webgl")

  const [state , dispatch ]  = useReducer(reducer , stateMachine.initial) ;
  const [results, setResult] = useState([]); 
  const [model , setModel]   = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const inputRef = useRef();
  const imageRef = useRef();
  const next = () => dispatch("next");

  const loadModel  = async() =>{
    next();
    const moblilenetModel = await mobilenet.load();
    setModel(moblilenetModel)
    next(); 
  } 
  const handleUpload = (e) =>{
    const {files} = e.target;
    if (files.length > 0 ) {
      const url =  URL.createObjectURL(files[0])
      setImageUrl(url);
      next();
    }
  }

  const identify = async()=>{
    next();
    const classificationResult =  await model.classify(imageRef.current);
    console.log(classificationResult);
    setResult(classificationResult);
    console.log(results);
    next();
  }

  const reset =()=>{
    setResult([]);
    setImageUrl(null); 
    next();
  }
  
  const buttonProps = {
    initial : { text : 'Load Model' , action :loadModel},
    loadingModel :{ text : 'Loading Model ...' , action :()=> {}},
    awaitingUpload : { text : 'Upload Photo' , action :()=> inputRef.current.click() },
    ready : { text : 'Identify' , action :identify},
    classiffing : { text : 'identifyng ...' , action :()=> {}},
    complete : { text : 'Reset' , action :reset},
  }

  const {showImage = false} = stateMachine.states[state] ;
  const {showResult =false} = stateMachine.states[state] ;
  return (
    <div>
      { showImage && <img alt = "upload preview" src ={imageUrl} ref  ={imageRef}></img>}

     { showResult && <ul>
        {results.map(formatResults)}
      </ul>}
      <input type= "file" accept = "image/*" capture="camera" ref = {inputRef} onChange = {handleUpload}></input>
      <button onClick ={buttonProps[state].action} >{buttonProps[state].text}</button>
    </div>
  );
}

export default App;
