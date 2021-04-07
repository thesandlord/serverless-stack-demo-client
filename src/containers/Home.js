import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Link } from "react-router-dom";
import { BsPencilSquare, BsSearch } from "react-icons/bs";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import { LinkContainer } from "react-router-bootstrap";
import { useAppContext } from "../libs/contextLib";
import { onError } from "../libs/errorLib";
import "./Home.css";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }

      try {
        const notes = await loadNotes();
        setNotes(notes);
        setFilteredNotes(notes);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated]);

  function setSearch(event) {
    const searchTerm = event.target.value;

    // If nothing is enetered in the search box, reset the filter
    if (!searchTerm) {
      setFilteredNotes(notes);
      return;
    }

    // Use simple client side filter 
    // Could add a debounce here if performace is an issue
    setFilteredNotes(notes.filter(({ content }) => content.indexOf(searchTerm) > -1))

  }

  function loadNotes() {
    return API.get("notes", "/notes");
  }

  function renderNotesList(notes) {
    return (
      <>
        <LinkContainer to="/notes/new">
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsPencilSquare size={17} />
            <span className="ml-2 font-weight-bold">Create a new note</span>
          </ListGroup.Item>
        </LinkContainer>
        {isLoading ?
          <ListGroup.Item>
            {
              // Show loading spinner inside the notes list while notes are still loading.
              // This is better than a full screen loading spinner because we aren't blocking the rest of the page paint
            }
            <span className="font-weight-bold">
              <Spinner animation="border" />
            </span>
            <br />
            <span className="text-muted">
              Loading Your Notes...
              </span>
          </ListGroup.Item>
          :
          notes.map(({ noteId, content, createdAt }) => (
            <LinkContainer key={noteId} to={`/notes/${noteId}`}>
              <ListGroup.Item action>
                <span className="font-weight-bold">
                  {content.trim().split("\n")[0]}
                </span>
                <br />
                <span className="text-muted">
                  Created: {new Date(createdAt).toLocaleString()}
                </span>
              </ListGroup.Item>
            </LinkContainer>
          ))
        }
      </>
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>Scratch</h1>
        <p className="text-muted">A simple note taking app</p>
        <div className="pt-3">
          <Link to="/login" className="btn btn-info btn-lg mr-3">
            Login
          </Link>
          <Link to="/signup" className="btn btn-success btn-lg">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  function renderNotes() {
    return (
      <div className="notes">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Notes</h2>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="search-mag"><BsSearch /></InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            placeholder="Search your notes..."
            aria-label="Search"
            aria-describedby="search-mag"
            onChange={setSearch}
          />
        </InputGroup>
        <ListGroup>{renderNotesList(filteredNotes)}</ListGroup>
      </div>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderNotes() : renderLander()}
    </div>
  );
}
