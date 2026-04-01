import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About Code Radar v2</h1>
        <p>A professional code complexity analyzer powered by Machine Learning and AI.</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>The Machine Learning Model</h2>
          <p>
            Traditional complexity analyzers rely solely on static rules (like Cyclomatic Complexity). 
            Code Radar goes a step further by employing a <strong>scikit-learn RandomForest Classifier</strong> to 
            predict code maintainability and complexity category (Low, Medium, High).
          </p>
          
          <h3>Feature Extraction</h3>
          <p>
            When you submit code, our backend attempts to parse it to extract critical features. 
            Python code is parsed into an Abstract Syntax Tree (AST), while other languages run through generalized structure rules measuring:
          </p>
          <ul className="feature-list">
            <li>Lines of Code (Total, Source, Blank, Comments)</li>
            <li>Number of Functions and Classes</li>
            <li>Number of Control Flow Blocks (If, For, While, Try)</li>
            <li>Maximum Nesting Depth</li>
            <li>Average Function Length</li>
          </ul>

          <h3>Model Training</h3>
          <p>
            These numerical vectors are fed into our pre-trained RandomForest model, which has been 
            trained on a balanced dataset of hundreds of code structures representing various complexity patterns.
            The model outputs a prediction alongside a confidence probability score.
          </p>
        </section>

        <section className="about-section">
          <h2>Groq AI Integration</h2>
          <p>
            Understanding that code is complex is only the first step. To provide actionable guidance, 
            we pass your code metrics directly to <strong>Groq's Llama 3.3 70B</strong> model.
          </p>
          <p>
            Groq's revolutionary LPU hardware generates high-quality refactoring suggestions almost instantaneously, 
            providing specific code examples on how to reduce cognitive load, simplify loops, and improve 
            overall architecture.
          </p>
        </section>
      </div>
    </div>
  );
}
