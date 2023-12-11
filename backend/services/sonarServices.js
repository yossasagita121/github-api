const { execSync } = require('child_process')
const axios = require('axios')

exports.analyseRepo = (request, response) => {
    const sonarScannerCommand = 'start cmd /C sonar-scanner'
    const sonarScannerOptions = [
        `-Dsonar.projectKey=github-api`,
        `-Dsonar.sources=.`,
        `-Dsonar.host.url=http://localhost:9000`,
        `-Dsonar.token=squ_a9a863f3daca317856ddedbed93b3a97473c9db8`
    ]
    const command = `${sonarScannerCommand} ${sonarScannerOptions.join(' ')}`
    const options = {
        cwd: './repo'
    }

    execSync(command, options)

    response.send("done")
}

exports.getCommitAnalyses = async (request, response) => {
    const token = 'squ_a9a863f3daca317856ddedbed93b3a97473c9db8'
    const component = 'github-api'

    const getDirKeys = async () => {
        try {
            const dirKeys = []

            let url = 'http://localhost:9000/api/components/tree'

            await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    component: component,
                    ps: '500'
                }
            }).then((res => {
                res.data.components.forEach(component => {
                    if (component.qualifier === 'DIR') {
                        dirKeys.push(component.key)
                    }
                })
            }))

            return dirKeys

        } catch (error) {
            console.log(`Error in getDirKeys : ${error}`)
        }
    }

    try {
        const dirKeys = await getDirKeys()
        const metricKeys = 'lines,bugs,vulnerabilities,code_smells,security_hotspots,coverage,duplicated_lines_density,files,violations,minor_violations,major_violations,critical_violations, blocker_violations'
        const url = 'http://localhost:9000/api/measures/component'

        const fetchMeasures = dirKeys.map((key =>
            axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    component: key,
                    metricKeys: metricKeys,
                }
            })
        ))

        Promise.all(fetchMeasures).then((res => {
            response.send(res.map((r => r.data)))
        }))

    } catch (error) {
        console.error(`Error in 'getCommitAnalyses': ${error}`)
    }
}

exports.getFileAnalyses = async (request, response) => {
    const commitSha = request.params.commit
    const token = 'squ_a9a863f3daca317856ddedbed93b3a97473c9db8'

    const getFileKeys = async () => {
        try {
            const fileKeys = []
            const component = `github-api:${commitSha}`
            const url = 'http://localhost:9000/api/components/tree'

            await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    component: component,
                }
            }).then((res => {
                res.data.components.forEach(component => {
                    fileKeys.push(component.key)
                })
            }))

            return fileKeys

        } catch (error) {
            return 'commitanalysesnotfound'
        }
    }

    try {
        const fileKeys = await getFileKeys()
        if (fileKeys !== 'commitanalysesnotfound') {
            const metricKeys = 'lines,bugs,vulnerabilities,code_smells,security_hotspots,coverage,duplicated_lines_density,violations,minor_violations,major_violations,critical_violations, blocker_violations'
            const url = 'http://localhost:9000/api/measures/component'

            const fetchMeasures = fileKeys.map((key =>
                axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        component: key,
                        metricKeys: metricKeys,
                    }
                })
            ))

            Promise.all(fetchMeasures).then((res => {
                response.send(res.map((r => r.data)))
            }))
        } else {
            response.send('commitanalysesnotfound')
        }

    } catch (error) {
        console.error(`Error in 'getFileMeasures': ${error}`)
    }
}