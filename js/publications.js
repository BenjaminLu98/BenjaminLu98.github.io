(function () {
  "use strict";

  function setText(el, text) {
    if (el) {
      el.textContent = text;
    }
  }

  function trimWrapping(value) {
    if (!value) {
      return "";
    }
    var trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
      trimmed = trimmed.slice(1, -1).trim();
    }
    return trimmed.replace(/\s+/g, " ");
  }

  function extractField(body, fieldName) {
    var pattern = new RegExp(fieldName + "\\s*=\\s*(\\{[\\s\\S]*?\\}|\\\"[\\s\\S]*?\\\")", "i");
    var match = body.match(pattern);
    if (!match) {
      return "";
    }
    return trimWrapping(match[1]);
  }

  function parseBibtex(text) {
    var entries = [];
    var entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,]+),([\s\S]*?)\}\s*(?=@|$)/g;
    var match;

    while ((match = entryRegex.exec(text)) !== null) {
      var body = match[3] || "";
      var title = extractField(body, "title");
      var author = extractField(body, "author");
      var journal = extractField(body, "journal") || extractField(body, "booktitle") || extractField(body, "publisher");
      var year = extractField(body, "year");
      var doi = extractField(body, "doi");
      var url = extractField(body, "url");

      if (!title && !author && !journal && !year) {
        continue;
      }

      entries.push({
        title: title,
        authors: author.replace(/\s+and\s+/gi, ", "),
        venue: journal,
        year: year,
        doi: doi,
        url: url
      });
    }

    return entries;
  }

  function renderPublications(publications, listId, emptyId) {
    var list = document.getElementById(listId);
    var emptyState = document.getElementById(emptyId);

    if (!list) {
      return;
    }

    list.innerHTML = "";

    if (!publications || publications.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
      }
      return;
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }

    publications.forEach(function (publication) {
      var item = document.createElement("li");

      var authors = publication.authors ? publication.authors + ". " : "";
      var year = publication.year ? "(" + publication.year + "). " : "";
      var venue = publication.venue ? publication.venue + "." : "";
      var doi = publication.doi ? " DOI: " + publication.doi + "." : "";

      var titleNode = document.createElement("span");
      if (publication.url) {
        var link = document.createElement("a");
        link.href = publication.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = publication.title || "Untitled";
        titleNode.appendChild(link);
      } else {
        setText(titleNode, publication.title || "Untitled");
      }

      item.appendChild(document.createTextNode(authors + year));
      item.appendChild(titleNode);
      item.appendChild(document.createTextNode(". " + venue + doi));

      list.appendChild(item);
    });

    if (typeof window.jQuery !== "undefined") {
      window.jQuery(window).trigger("resize");
    }
  }

  function loadBibFile(path) {
    return fetch(path)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("No BibTeX file found");
        }
        return response.text();
      })
      .then(function (text) {
        return parseBibtex(text);
      })
      .catch(function () {
        return [];
      });
  }

  function loadPublications() {
    Promise.all([
      loadBibFile("publications/journal.bib"),
      loadBibFile("publications/conference.bib")
    ]).then(function (results) {
      renderPublications(results[0], "publications-journal", "publications-journal-empty");
      renderPublications(results[1], "publications-conference", "publications-conference-empty");
    });
  }

  document.addEventListener("DOMContentLoaded", loadPublications);
})();
