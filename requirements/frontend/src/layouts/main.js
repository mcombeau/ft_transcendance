import Navbar from '../components/navbar/navbar'
import  { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import Home from '../components/home/home'
import Contact from '../components/contact/contact'
import About from '../components/about/about'

function Main() {
    return (
        <div>
            <HashRouter>
                <Navbar></Navbar>
                <div className="content">
                
                    <Routes>
                        <Route exact path="/" component={Home}/>
                        <Route path="/contact" component={Contact}/>
                        <Route path="/about" component={About}/>
                    </Routes>
                </div>
            </HashRouter>
        </div>
    )
}

export default Main;
