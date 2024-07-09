const content = document.getElementById('content');

async function getRandomNumber() {
    const result = await fetch('/api/random/number')
        .then(r => r.text());

    console.log(result);
    
    return result;
}

async function main() {
    const randomNumber = await getRandomNumber();
    content.innerHTML = `<h1>${randomNumber}</h1>`
}

main().then();
