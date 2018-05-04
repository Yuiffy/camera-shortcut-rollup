import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import Camera from "./Camera";

class App extends Component {

  onSendImage(fileObj, name) {
    const form = new FormData();
    form.append('image', fileObj, name);
    const apiUrl = `/ocr/uploadImage`;
    fetch(apiUrl, {
      method: 'POST',
      credentials: 'same-origin',
      body: form,
      headers: {
        // 'content-type': 'application/json',
      },
    }).then((response) => {
      console.log(response);
      if (response.status == 200)
        alert("success! " + JSON.stringify(response.body));
      else
        alert(`Error, response: ${response.status} ${response.statusText}`)
    }).catch((e) => {
      console.log(e);
      alert("error! " + JSON.stringify(e))
    });
  }

  render() {
    return (
      <Camera onSendImage={this.onSendImage}/>
    );
  }
}

export default App;
