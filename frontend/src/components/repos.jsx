import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import moment from 'moment';
import { IoLocationSharp } from "react-icons/io5"
import { AiOutlineLink, AiOutlineTwitter, AiOutlineStar, AiOutlineEye, AiOutlineFork } from "react-icons/ai"
import { PiGithubLogoFill } from "react-icons/pi"
import axios from "axios";

export default function Repos() {
    const [repos, setRepos] = useState([])
    const [user, setUser] = useState([])
    const [followers, setFollowers] = useState([])
    const { username } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        async function getData() {
            const githubToken = 'token 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'
            try {
                await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, {
                    headers: {
                        Authorization: githubToken
                    }
                }).then(response => {
                    setRepos(response.data)
                })

                await axios.get(`https://api.github.com/users/${username}`, {
                    headers: {
                        Authorization: githubToken
                    }
                }).then(response => {
                    setUser(response.data)
                })

                await axios.get(`https://api.github.com/users/${username}/followers?per_page=100`, {
                    headers: {
                        Authorization: githubToken
                    }
                }).then(response => {
                    setFollowers(response.data)
                })

            } catch (error) {
                alert(error)
                window.history.back()
            }
        }

        getData()
    }, [])

    if (repos.message === 'Not Found') {
        navigate(`/repos/${username}/error`)
    } else {
        return (
            <div>

                <div className="d-flex flex-column">
                    <div className="d-flex flex-row card p-4">
                        <div className="avatar">
                            <img src={user.avatar_url} className="img-thumbnail" alt="..." />
                        </div>
                        <div className="d-flex flex-column justify-content-center card-body">
                            <h4 className="card-title m-0">{user.name}</h4>
                            <p className="card-text my-2">{user.bio}</p>
                            <div className="d-flex flex-row">
                                <p className="card-text m-0"><small className="text-body-secondary">Followers : {user.followers}</small></p>
                                <p className="card-text m-0 px-2"><small className="text-body-secondary">Following : {user.following}</small></p>
                                <p className="card-text m-0">
                                    {user.location != null ?
                                        <small className="text-body-secondary"> <IoLocationSharp className="mb-1" />{user.location}</small>
                                        :
                                        ""
                                    }
                                </p>
                            </div>
                            <div className="d-flex flex-row">
                                <p className="card-text m-0">
                                    <small className="text-body-secondary"> <AiOutlineLink className="mb-1" /><a href={user.html_url} className="text-decoration-none" target="blank">{user.html_url}</a></small>
                                </p>
                                <div className="px-1"></div>
                                <p className="card-text m-0">
                                    {user.twitter_username != null ?
                                        <small className="text-body-secondary"><AiOutlineTwitter className="mb-1" />
                                            <a href={`https://twitter.com/${user.twitter_username}`} className="text-decoration-none" target="blank">@{user.twitter_username}</a>
                                        </small>
                                        :
                                        ""
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex flex-row py-4 w-100">

                        <div className="d-flex flex-column repos-start border-end px-4 col-3">
                            <p> <b>{followers.length}</b> Followers</p>

                            {followers.map((follower, index) => (
                                <div className="card p-2 mb-2" key={index}>
                                    <div className="d-flex flex-row">
                                        <img className="followers-avatar" src={follower.avatar_url} alt="" />
                                        <div className="mx-1"></div>
                                        <div className="d-flex flex-column flex-fill overflow-hidden">
                                            <small className="text-truncate">{follower.login}</small>
                                            <div className="d-flex flex-row justify-content-end">
                                                <a href={follower.html_url} target="blank"><PiGithubLogoFill className="fs-5 text-dark" /></a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>


                        <div className="d-flex flex-column w-100 px-4">
                            <p> <b>{repos.length}</b> Repositories</p>

                            {repos.sort((a, b) => b.stargazers_count - a.stargazers_count).map((repo, index) => (
                                <div className="d-flex flex-row card mb-3" key={index}>
                                    <div className="card-header p-3 border-right"></div>
                                    <div className="d-flex flex-column p-3 w-100">
                                        <div className="d-flex flex-row">
                                            <p className="m-0 fw-medium">{repo.name}</p>
                                            <div className="px-2"></div>
                                            <span className="badge text-bg-success">
                                                {repo.visibility}
                                            </span>
                                        </div>
                                        <div className="py-1"></div>
                                        <p className="m-0">{repo.description}</p>
                                        <div className="d-flex flex-row py-1">
                                            <small><i>{repo.language ? repo.language : "Language not defined"}</i></small>
                                            <div className="px-2"></div>
                                            <small><AiOutlineStar className="mb-1" /> {repo.stargazers_count}</small>
                                            <div className="px-2"></div>
                                            <small><AiOutlineFork className="mb-1" /> {repo.forks_count}</small>
                                            <div className="px-2"></div>
                                            <small><AiOutlineEye className="mb-1" /> {repo.watchers_count}</small>
                                        </div>
                                        <div className="d-flex flex-row">
                                            <small className="text-body-secondary">Created at : {moment(repo.created_at).format('D MMMM YYYY')}</small>
                                            <div className="px-2"></div>
                                            <small className="text-body-secondary">Last Updated : {moment(repo.update_at).format('D MMMM YYYY')}</small>
                                        </div>
                                        <div className="d-flex flex-row justify-content-end">
                                            <button onClick={() => {
                                                navigate(`/repo/${repo.full_name}`)
                                            }} type="button" className="btn btn-primary btn-sm">Detail</button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>

                    </div>
                </div>
            </div>
        )
    }


}