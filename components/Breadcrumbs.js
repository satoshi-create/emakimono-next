import styled from "styled-components";

const BreadcrumbStyle = styled.div`
margin:2rem 0;
  nav {
    display: grid;
    grid-template-columns: 1fr min(calc(100vw - (5vw * 2)), 1024px) 1fr;
   > * {
    grid-column:2;
  }
 > ol {
    display: flex;
    align-items: center;
    list-style: none;

    >li {
      margin-right: 8px;

      &:after {
        content: ">";
        display: inline-block;
        margin-left: 4px;
        font-size: clamp(0.375rem, 0.0861rem + 1.2327vw, 0.875rem);
      }

      &:last-child:after {
        content: "";
      }
    }

    a {
      text-decoration: none;
      color: #666;
      font-size: clamp(0.375rem, 0.0861rem + 1.2327vw, 0.875rem);
    }
  }

  .brActive > * {
    color: #ff97c7;
  }
`;

export default BreadcrumbStyle;
