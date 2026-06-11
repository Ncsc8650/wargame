import urllib.request
import re

url = 'https://pubgmap.io/erangel.html'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    
    # Replace relative paths with absolute paths
    html = html.replace('href="/', 'href="https://pubgmap.io/')
    html = html.replace('src="/', 'src="https://pubgmap.io/')
    
    with open('pubgmap_erangel.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully created pubgmap_erangel.html")
except Exception as e:
    print(f"Error: {e}")
