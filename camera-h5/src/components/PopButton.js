import React from "react";
import './PopButton.css';
import {MdSettings} from 'react-icons/lib/md';

class PopButton extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      pop: props.pop ? props.pop : false
    };
  }

  changePop() {
    this.setState({...this.state, pop: !this.state.pop});
  }

  render() {
    const {pop} = this.state;
    const {children, className: classNames} = this.props;
    return (
      <div className={'pop-button-field ' + classNames}>
        <MdSettings className='pop-button' onClick={this.changePop.bind(this)}/>
        {pop ? children : null}
      </div>
    );
  }
}

export default PopButton;
