const { default: axios } = require('axios')
const fs = require('fs')
const path = require('path')

exports.addRepo = async (request, response) => {
    const directoryPath = './repo'

    const removeContents = async (dirPath) => {
        try {
            const files = fs.readdirSync(dirPath)
            for (const file of files) {
                const filePath = path.join(dirPath, file)
                const stat = fs.statSync(filePath)

                if (stat.isDirectory()) {
                    removeContents(filePath)
                    fs.rmdirSync(filePath)
                } else {
                    fs.unlinkSync(filePath)
                }
            }
        } catch (error) {
            console.error(`Error removing contents: ${error}`)
        }
    }

    const getCommits = async () => {
        const commitsUrl = request.body.map((r) => r.url)
        const commitPromises = []

        for (const commitUrl of commitsUrl) {
            const commitPromise = axios.get(commitUrl, {
                headers: {
                    Authorization: 'token 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',
                },
            }).then(async (response) => {
                const dirName = response.data.sha
                fs.mkdirSync(`./repo/${dirName}`)

                const filePromises = response.data.files.map(async (file) => {
                    const fileResponse = await axios.get(file.contents_url, {
                        headers: {
                            Authorization: 'token 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',
                        },
                    })
                    const filename = fileResponse.data.name
                    const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8')
                    fs.writeFileSync(`./repo/${dirName}/${fileResponse.data.sha + path.extname(filename)}`, content)
                })

                await Promise.all(filePromises)
            })

            commitPromises.push(commitPromise)
        }

        return Promise.all(commitPromises)
    }

    await removeContents(directoryPath)
    await getCommits()
    response.send("done")
}