import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AiOutlineLink, AiOutlineStar, AiOutlineEye, AiOutlineFork, AiFillFile, AiFillFolder } from "react-icons/ai"
import { LuFolderTree } from "react-icons/lu"
import { PiGithubLogoFill } from "react-icons/pi"
import moment from 'moment';
import axios from "axios"

export default function Repo() {
    const [repo, setRepo] = useState([])
    const [languages, setLanguages] = useState([])
    const [contents, setContents] = useState([])
    const [commits, setCommits] = useState([])
    const { username, name } = useParams()
    const navigate = useNavigate()

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

            await axios.get(`https://api.github.com/repos/${username}/${name}/contents`, {
                headers: {
                    Authorization: githubToken
                }
            }).then(response => {
                setContents(response.data)
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

    const uniqueAuthors = [...new Set(commits.map(commit => commit.author.login))]

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
                    <div className="d-flex flex-column repos-start col-3">
                        <div className="d-flex flex-row justify-content-between">
                            <p> <b>{uniqueAuthors.length}</b> Contributors</p>
                            <button onClick={() => navigate(`/statistic/${username}/${name}`)} className="btn btn-link p-0 link-offset-2 link-underline link-underline-opacity-0">
                                <p className="fw-medium">Statistics</p>
                            </button>
                        </div>
                        {uniqueAuthors.map((authorLogin, index) => (
                            <div key={index} className="card p-2 mb-2">
                                <div className="d-flex flex-row">
                                    <img className="followers-avatar" src={commits.find(commit => commit.author.login === authorLogin).author.avatar_url} alt="" />
                                    <div className="mx-1"></div>
                                    <div className="d-flex flex-column flex-fill overflow-hidden">
                                        <small className="text-truncate">{commits.find(commit => commit.author.login === authorLogin).commit.author.name}</small>
                                        <div className="d-flex flex-row justify-content-between">
                                            <small>{commits.filter(commit => commit.author.login === authorLogin).length} Commits</small>
                                            <div className="d-flex flex-row gap-3">
                                                <a href={commits.find(commit => commit.author.login === authorLogin).html_url} target="blank">
                                                    <PiGithubLogoFill className="fs-5 text-dark" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="d-flex flex-column col-6 px-3">
                        <p> <b>{contents.length}</b> Contents</p>

                        <div className="card w-100">
                            <div className="card-header d-flex flex-row justify-content-between">
                                <LuFolderTree className="fs-4" />
                            </div>
                            <ul className="list-group list-group-flush overflow-hidden">
                                {contents.map((content, index) => (
                                    content.type === "dir" &&
                                    (
                                        <div key={index}>
                                            <li className="list-group-item d-flex flex-row justify-content-between">
                                                <div className="d-flex flex-row gap-1">
                                                    <AiFillFolder className="text-primary fs-5" />
                                                    <small>{content.name}</small>
                                                </div>
                                                <small className="text-secondary">...</small>
                                            </li>
                                        </div>
                                    )
                                ))}

                                {contents.map((content, index) => (
                                    content.type === "file" &&
                                    (
                                        <div key={index}>
                                            <li className="list-group-item d-flex flex-row justify-content-between">
                                                <div className="d-flex flex-row gap-1">
                                                    <AiFillFile className="text-secondary fs-5" />
                                                    <small>{content.name}</small>
                                                </div>
                                                <small className="text-secondary">{content.size} Bytes</small>
                                            </li>
                                        </div>
                                    )
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="d-flex flex-column w-100">
                        <p> <b>{commits.length}</b> Commits</p>

                        <div className="card">
                            <div className="d-flex flex-row">
                                <div className="card-header px-3"></div>
                                <ul className="list-group list-group-flush w-100">
                                    {commits.map((commit, index) => (
                                        <li key={index} className="list-group-item d-flex flex-column p-2">
                                            <small>{commit.commit.author.name.length > 15 ? `${commit.commit.author.name.slice(0, 30)}...` : commit.commit.author.name}</small>
                                            <small className="text-secondary">{moment(commit.commit.author.date).format('D MMMM YYYY')}</small>
                                            <div className="d-flex flex-row justify-content-end">
                                                <small className="align-content-start">
                                                    <button onClick={() => navigate(`/commits/${username}/${name}/${commit.author.login}`)} className="btn btn-link p-0 link-offset-2 link-underline link-underline-opacity-0"><small>See more</small></button>
                                                </small>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    )
}