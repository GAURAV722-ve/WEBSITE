import React from 'react'
import { Bookmark } from "lucide-react";

const Cards=(props)=> {
  return (
    <div>
      <div className="card">
      <div className="top">
        <img
          src={props.brandLogo}
          alt="card"
        />
        <button>Save <Bookmark  size={15} /></button>
      </div>
      <div className="center">
        <h3>{props.company} <span>{props.datePosted}</span></h3>
        <h2>{props.post}</h2>
        <div className="tag">
          <h4>{props.tag1}</h4>
          <h4>{props.tag2}</h4>
        </div>
      </div>
      <hr className="divider" />
      <div className="bottom">
        <div>
            <h3>${props.pay}/hr</h3>
            <p>{props.location}</p>
          </div>
          <button>Apply Now</button>
      </div>
    </div>
    </div>
  )
}

export default Cards
