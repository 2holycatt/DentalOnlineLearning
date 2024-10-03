import React from 'react';
import { render } from 'react-dom';
import HelloWorld from './components/HelloWorld';
import TestReact from './components/testReact';
import App from './App';

import './styles/styles.css';

render(<HelloWorld />, document.getElementById('react-root'));
// render(<TestReact />, document.getElementById('testReact'));
render(<App />, document.getElementById('root'));
