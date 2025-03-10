import ReactDOMWrapper from '@/.';

function ContentScript() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ContentScript</h1>
      </header>
    </div>
  );
}

ReactDOMWrapper(<ContentScript />, 'novzella-content-script');
