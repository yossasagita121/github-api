import React from "react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { AiOutlineLink, AiOutlineStar, AiOutlineEye, AiOutlineFork } from "react-icons/ai"
import { LuFolderTree } from "react-icons/lu"
import moment from 'moment'
import axios from "axios"

export default function Commits() {
    const { username, name, login } = useParams()
    const [repo, setRepo] = useState([])
    const [languages, setLanguages] = useState([])
    const [commits, setCommits] = useState([])
    const [commit, setCommit] = useState([])
    const [activeCommiter, setActiveCommiter] = useState(login)
    const [activeCommit, setActiveCommit] = useState("")
    const [activeFile, setActiveFile] = useState("")

    useEffect(() => {
        async function getData() {
            const githubToken = 'token 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'
            await axios.get(`https://api.github.com/repos/${username}/${name}`, {
                headers: {
                    Authorization: githubToken
                }
            }).then(response => {
                setRepo(response.data)
            })

            await axios.get(`https://api.github.com/repos/${username}/${name}/languages`, {
                headers: {
                    Authorization: githubToken
                }
            }).then(response => {
                setLanguages(Object.keys(response.data))
            })

            await axios.get(`https://api.github.com/repos/${username}/${name}/commits?per_page=100`, {
                headers: {
                    Authorization: githubToken
                }
            }).then(response => {
                const filteredCommits = response.data.filter(commit => commit.author !== null)
                setCommits(filteredCommits)
            })
        }
        getData()
    }, [name, username])

    const commiters = commits.filter((obj, index) => {
        return index === commits.findIndex(o => obj.author.login === o.author.login);
    })

    const fetchCommit = async (url) => {
        try {
            await fetch(url)
                .then(respon => {
                    return respon.json()
                })
                .then(responJSON => {
                    setCommit(responJSON)
                })
        } catch (error) {

        }
    }

    return (
        <div>

            <div className="d-flex flex-column p-4 gap-4">
                <div className="d-flex flex-column card overflow-hidden">
                    <div className="card-header p-3"></div>
                    <div className="d-flex flex-row">
                        <div className="d-flex flex-column justify-content-center card-body">
                            <h4 className="card-title m-0">{repo.name}</h4>
                            <div className="d-flex flex-row justify-content-between mt-2">
                                <p className="card-text m-0 mb-2">{repo.description}</p>
                                <div className="d-flex flex-row">
                                    <p className="card-text m-0"><AiOutlineStar className="mb-1" /> {repo.stargazers_count}</p>
                                    <p className="card-text m-0 px-3"><AiOutlineEye className="mb-1" /> {repo.watchers_count}</p>
                                    <p className="card-text m-0"><AiOutlineFork className="mb-1" /> {repo.forks_count}</p>
                                </div>
                            </div>

                            <div className="d-flex flex-row justify-content-between">
                                <p className="card-text m-0 mb-1">
                                    <small className="text-body-secondary"><AiOutlineLink /> <a href={repo.html_url} className="text-decoration-none" target="blank">{repo.html_url}</a></small>
                                </p>

                                <div className="d-flex flex-row">
                                    {languages.map((language, index) => (
                                        <small key={index}><i className="text-body-secondary mx-1">{language}</i></small>
                                    ))}
                                </div>

                            </div>

                            <div className="d-flex flex-row">
                                <small>
                                    <i>Created Date : {moment(repo.created_at).format('D MMMM YYYY')}</i>
                                </small>
                                <div className="mx-2"></div>
                                <small>
                                    <i>Last Updated : {moment(repo.updated_at).format('D MMMM YYYY')}</i>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex flex-row pb-4">

                    <div className="d-flex flex-column col-2">
                        <p> <b>{commiters.length}</b> Commiters</p>

                        <div className="list-group">
                            {commiters.map((commiter, index) => (
                                <button key={index} onClick={() => {
                                    setActiveCommiter(commiter.author.login)
                                    setActiveCommit("")
                                }} type="button" className={`list-group-item overflow-hidden list-group-item-action ${commiter.author.login === activeCommiter ? "active" : ""}`}>
                                    <small className="text-truncate">{commiter.author.login}</small>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="d-flex flex-column px-3 col-3">
                        <p><b>{commits.filter((commit => commit.author.login === activeCommiter)).length}</b> Commits</p>

                        <div className="d-flex flex-column card">
                            <div className="card-header">{activeCommiter}</div>
                            <ul className="list-group list-group-flush">
                                {commits.map((commit, index) => (
                                    commit.author.login === activeCommiter && (
                                        <button key={index} onClick={() => {
                                            fetchCommit(commit.url)
                                            setActiveCommit(commit.sha)
                                            setActiveFile("")
                                        }} type="button" className={`list-group-item overflow-hidden list-group-item-action d-flex flex-column ${commit.sha === activeCommit ? "active" : ""}`}>
                                            <small className="mb-1 text-truncate col-11">{commit.commit.message}</small>
                                            <div className="d-flex flex-row justify-content-end w-100">
                                                <small>
                                                    <i>{moment(commit.commit.author.date).format('D MMMM YYYY')}</i>
                                                </small>
                                            </div>
                                        </button>
                                    )
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="d-flex flex-column col-7">
                        <p><b>{activeCommit !== "" && commit.commit ? commit.files.length : ""}</b> Contents</p>

                        {activeCommit !== "" && commit.commit ?
                            <div className="d-flex flex-column card border-0">
                                <div className="card-header d-flex flex-row justify-content-between border border-bottom-0">
                                    <span><LuFolderTree className="fs-5" /></span>
                                    <div className="d-flex flex-row gap-3">
                                        <small>Commit status : </small>
                                        <small>Total : <span className="fw-medium">{commit.stats.total}</span></small>
                                        <small>Additions : <span className="fw-medium">{commit.stats.additions}</span></small>
                                        <small>Deletions : <span className="fw-medium">{commit.stats.deletions}</span></small>
                                    </div>
                                </div>
                                <div className="d-flex flex-row">
                                    <div className="list-group col-2">
                                        <button onClick={() => setActiveFile("")} type="button" className={`list-group-item list-group-item-action ${activeFile === "" ? "active" : ""} rounded-0`}>
                                            <small>Message</small>
                                        </button>
                                        {commit.files.map((file, index) => (
                                            <button key={index} onClick={() => setActiveFile(file.sha)} type="button" className={`list-group-item list-group-item-action ${file.sha === activeFile ? "active" : ""} rounded-0`}>
                                                <small>{file.filename.substring(file.filename.lastIndexOf('/') + 1)}</small>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="d-flex flex-column card col-10 border-0">
                                        {activeFile !== "" ?
                                            <div className="card-header border border-start-0 rounded-0 d-flex flex-row justify-content-end gap-3">
                                                {commit.files.map((file, index) => (
                                                    file.sha === activeFile && (
                                                        <div key={index}>
                                                            <small>File status : <span className="badge text-bg-primary">{file.status}</span></small>
                                                            <small className="mx-2">Additions : <span className="badge text-bg-success">{file.additions}</span></small>
                                                            <small className="mx-2">Changes : <span className="badge text-bg-warning">{file.changes}</span></small>
                                                            <small>Deletions : <span className="badge text-bg-danger">{file.deletions}</span></small>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                            :
                                            ""
                                        }
                                        <span className="p-2 border border-top-0 h-100">
                                            {activeFile !== "" ?
                                                commit.files.map((file, index) => (
                                                    file.sha === activeFile && (
                                                        <small key={index}><pre>{file.patch}</pre></small>
                                                    )
                                                ))
                                                :
                                                <small><pre>{commit.commit.message}</pre></small>
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="card border-bottom-0">
                                <div className="card-header text-secondary">
                                    Please pick a commit!
                                </div>
                            </div>
                        }
                    </div>

                </div>
            </div >

        </div >
    )
}